import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';

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
  ) {}

  /**
   * Get or create a cart for a user
   */
  async getOrCreateCart(userId: number, t?: Transaction): Promise<Cart> {
    const [cart] = await this.cartModel.findOrCreate({
      where: { userId },
      defaults: { totalQuantity: 0, totalAmount: 0 } as any,
      transaction: t,
    });
    return cart;
  }

  /**
   * Recalculate and persist total_quantity + total_amount for a cart
   */
  private async recalculateTotals(cartId: number, t: Transaction): Promise<void> {
    const items = await this.cartItemModel.findAll({ where: { cartId }, transaction: t });
    const total_quantity = items.length;

    let total_amount = 0;
    for (const item of items) {
      const course = await this.courseModel.findByPk(item.courseId, { transaction: t });
      if (course) total_amount += Number(course.price);
    }

    await this.cartModel.update(
      { totalQuantity: total_quantity, totalAmount: total_amount },
      { where: { id: cartId }, transaction: t },
    );
  }

  /**
   * Add a course to the user's cart
   */
  async addItem(userId: number, courseId: number): Promise<CartItem> {
    return this.sequelize.transaction(async (t) => {
      const course = await this.courseModel.findByPk(courseId, { transaction: t });
      if (!course) {
        throw new NotFoundException(`Không tìm thấy khóa học ID: ${courseId}`);
      }

      const cart = await this.getOrCreateCart(userId, t);

      const existingItem = await this.cartItemModel.findOne({
        where: { cartId: cart.id, courseId },
        transaction: t,
      });

      if (existingItem) {
        throw new ConflictException('Khóa học đã có trong giỏ hàng');
      }

      const item = await this.cartItemModel.create(
        { cartId: cart.id, courseId },
        { transaction: t },
      );
      await this.recalculateTotals(cart.id, t);
      return item;
    });
  }

  /**
   * Remove a course from the user's cart
   */
  async removeItem(userId: number, courseId: number): Promise<void> {
    return this.sequelize.transaction(async (t) => {
      const cart = await this.cartModel.findOne({ where: { userId }, transaction: t });
      if (!cart) {
        throw new NotFoundException('Giỏ hàng không tồn tại');
      }

      const deleted = await this.cartItemModel.destroy({
        where: { cartId: cart.id, courseId },
        transaction: t,
      });

      if (!deleted) {
        throw new NotFoundException('Khóa học không có trong giỏ hàng');
      }

      await this.recalculateTotals(cart.id, t);
    });
  }

  /**
   * Get the user's cart with items, total_quantity and total_amount
   */
  async getCart(userId: number): Promise<any> {
    const itemInclude = {
      model: CartItem,
      attributes: ['course_id', 'created_at'],
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
      if (!cart) throw new NotFoundException('Không thể khởi tạo giỏ hàng');
    }

    const plain = cart.get({ plain: true });
    return {
      ...plain,
      items: (plain.items ?? []).map((item: any) => ({
        courseId: item.courseId,
        created_at: item.created_at,
      })),
    };
  }

  /**
   * Clear all items from the user's cart
   */
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
