import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { col, fn, Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';
import { Enroll } from '../models/enroll.model';
import { Feedback } from '../models/feedback.model';
import { HighlightFeed, HighlightFeedStatus } from '../models/highlight-feed.model';
import { Video, VideoType } from '../models/video.model';
import { User } from '../users/user.model';

type CartCourseRating = {
  avg_rating: number;
  review_count: number;
};

@Injectable()
export class CartsService {
  constructor(
    @InjectConnection() private sequelize: Sequelize,
    @InjectModel(Cart)
    private cartModel: typeof Cart,
    @InjectModel(CartItem)
    private cartItemModel: typeof CartItem,
    @InjectModel(Course)
    private courseModel: typeof Course,
    @InjectModel(Feedback)
    private feedbackModel: typeof Feedback,
    @InjectModel(Enroll)
    private enrollModel: typeof Enroll,
  ) {}

  async getOrCreateCart(userId: number, t?: Transaction): Promise<Cart> {
    const [cart] = await this.cartModel.findOrCreate({
      where: { userId },
      defaults: { totalQuantity: 0, totalAmount: 0 } as any,
      transaction: t,
    });
    return cart;
  }

  private async recalculateTotals(cartId: number, t: Transaction): Promise<void> {
    const items = await this.cartItemModel.findAll({
      where: { cartId, savedForLater: false },
      transaction: t,
    });

    let totalAmount = 0;
    for (const item of items) {
      const course = await this.courseModel.findByPk(item.courseId, { transaction: t });
      if (course) {
        totalAmount += Number(course.price);
      }
    }

    await this.cartModel.update(
      { totalQuantity: items.length, totalAmount },
      { where: { id: cartId }, transaction: t },
    );
  }

  async addItem(userId: number, courseId: number): Promise<CartItem> {
    return this.sequelize.transaction(async (t) => {
      const course = await this.courseModel.findByPk(courseId, { transaction: t });
      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }

      const cart = await this.getOrCreateCart(userId, t);
      const existingItem = await this.cartItemModel.findOne({
        where: { cartId: cart.id, courseId },
        transaction: t,
      });

      if (existingItem) {
        if (existingItem.savedForLater) {
          await existingItem.update({ savedForLater: false }, { transaction: t });
          await this.recalculateTotals(cart.id, t);
          return existingItem;
        }
        throw new ConflictException('Course already exists in cart');
      }

      const item = await this.cartItemModel.create(
        { cartId: cart.id, courseId },
        { transaction: t },
      );
      await this.recalculateTotals(cart.id, t);
      return item;
    });
  }

  async removeItem(userId: number, courseId: number): Promise<void> {
    return this.sequelize.transaction(async (t) => {
      const cart = await this.cartModel.findOne({ where: { userId }, transaction: t });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const deleted = await this.cartItemModel.destroy({
        where: { cartId: cart.id, courseId },
        transaction: t,
      });

      if (!deleted) {
        throw new NotFoundException('Course is not in cart');
      }

      await this.recalculateTotals(cart.id, t);
    });
  }

  async getCart(userId: number): Promise<any> {
    const itemInclude = {
      model: CartItem,
      attributes: ['id', 'courseId', 'savedForLater', 'created_at'],
      include: [
        {
          model: Course,
          attributes: ['id', 'name', 'price', 'level', 'duration', 'userId', 'thumbnailUrl'],
          include: [
            {
              model: Video,
              as: 'video',
              required: false,
              attributes: ['id', 'thumbnail', 'url'],
            },
            {
              model: User,
              as: 'instructor',
              required: false,
              attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
            },
            {
              model: HighlightFeed,
              as: 'highlightFeeds',
              required: false,
              where: { status: HighlightFeedStatus.ACTIVE },
              attributes: ['id', 'title'],
              include: [
                {
                  model: Video,
                  as: 'video',
                  required: true,
                  where: {
                    type: VideoType.HIGHLIGHT,
                    url: { [Op.ne]: null },
                  },
                  attributes: ['id', 'url'],
                },
              ],
            },
          ],
        },
      ],
    };

    let cart = await this.cartModel.findOne({
      where: { userId },
      include: [itemInclude],
    });

    if (!cart) {
      await this.getOrCreateCart(userId);
      cart = await this.cartModel.findOne({
        where: { userId },
        include: [itemInclude],
      });
      if (!cart) {
        throw new NotFoundException('Unable to initialize cart');
      }
    }

    const plain = cart.get({ plain: true });
    const courseIds = (plain.items ?? [])
      .map((item: any) => item.courseId)
      .filter((courseId: unknown): courseId is number => Number.isInteger(courseId));
    const { ratingMap, enrollMap } = await this.loadCartCourseAggregates(courseIds);

    return {
      ...plain,
      items: (plain.items ?? []).map((item: any) => ({
        id: item.id,
        courseId: item.courseId,
        saved_for_later: Boolean(item.savedForLater),
        created_at: item.created_at,
        course: item.course
          ? this.serializeCartCourse(
              item.course,
              ratingMap.get(item.courseId),
              enrollMap.get(item.courseId) ?? 0,
            )
          : null,
      })),
    };
  }

  private async loadCartCourseAggregates(courseIds: number[]) {
    const ratingMap = new Map<number, CartCourseRating>();
    const enrollMap = new Map<number, number>();
    if (courseIds.length === 0) {
      return { ratingMap, enrollMap };
    }

    const [ratingRows, enrollRows] = await Promise.all([
      this.feedbackModel.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          isVisible: true,
        },
        attributes: [
          'courseId',
          [fn('AVG', col('rating')), 'avg_rating'],
          [fn('COUNT', col('id')), 'review_count'],
        ],
        group: ['courseId'],
        raw: true,
      }),
      this.enrollModel.findAll({
        where: { courseId: { [Op.in]: courseIds } },
        attributes: [
          'courseId',
          [fn('COUNT', col('id')), 'enrolled_count'],
        ],
        group: ['courseId'],
        raw: true,
      }),
    ]);

    for (const row of ratingRows as unknown as Array<Record<string, unknown>>) {
      ratingMap.set(Number(row.courseId), {
        avg_rating: Number(row.avg_rating ?? 0),
        review_count: Number(row.review_count ?? 0),
      });
    }
    for (const row of enrollRows as unknown as Array<Record<string, unknown>>) {
      enrollMap.set(Number(row.courseId), Number(row.enrolled_count ?? 0));
    }

    return { ratingMap, enrollMap };
  }

  private serializeCartCourse(course: any, rating: CartCourseRating | undefined, enrolledCount: number) {
    const highlightFeed = Array.isArray(course.highlightFeeds)
      ? course.highlightFeeds.find((feed: any) => feed.video?.url)
      : undefined;
    const { highlightFeeds, ...rest } = course;

    return {
      ...rest,
      avg_rating: rating?.avg_rating ?? 0,
      review_count: rating?.review_count ?? 0,
      enrolled_count: enrolledCount,
      highlight_video_url: highlightFeed?.video?.url,
      highlight_title: highlightFeed?.title,
    };
  }

  async saveItemForLater(userId: number, courseId: number, saved: boolean): Promise<void> {
    return this.sequelize.transaction(async (t) => {
      const cart = await this.cartModel.findOne({ where: { userId }, transaction: t });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const item = await this.cartItemModel.findOne({
        where: { cartId: cart.id, courseId },
        transaction: t,
      });
      if (!item) {
        throw new NotFoundException('Course is not in cart');
      }

      await item.update({ savedForLater: saved }, { transaction: t });
      await this.recalculateTotals(cart.id, t);
    });
  }

  async clearCart(userId: number): Promise<void> {
    return this.sequelize.transaction(async (t) => {
      const cart = await this.cartModel.findOne({ where: { userId }, transaction: t });
      if (cart) {
        await this.cartItemModel.destroy({ where: { cartId: cart.id }, transaction: t });
        await this.cartModel.update(
          { totalQuantity: 0, totalAmount: 0 },
          { where: { id: cart.id }, transaction: t },
        );
      }
    });
  }
}
