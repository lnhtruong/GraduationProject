import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Course } from '../models/course.model';

@Injectable()
export class CartsService {
  constructor(
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
  async getOrCreateCart(userId: number): Promise<Cart> {
    const [cart] = await this.cartModel.findOrCreate({
      where: { userId },
      defaults: { totalQuantity: 0, totalAmount: 0 } as any,
    });
    return cart;
  }

  /**
   * Recalculate and persist total_quantity + total_amount for a cart
   */
  private async recalculateTotals(cartId: number): Promise<void> {
    const items = await this.cartItemModel.findAll({ where: { cartId } });
    const total_quantity = items.length;

    let total_amount = 0;
    for (const item of items) {
      const course = await this.courseModel.findByPk(item.courseId);
      if (course) total_amount += Number(course.price);
    }

    await this.cartModel.update(
      { totalQuantity: total_quantity, totalAmount: total_amount },
      { where: { id: cartId } },
    );
  }

  /**
   * Add a course to the user's cart
   */
  async addItem(userId: number, courseId: number): Promise<CartItem> {
    const course = await this.courseModel.findByPk(courseId);
    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học ID: ${courseId}`);
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.cartItemModel.findOne({
      where: { cartId: cart.id, courseId },
    });

    if (existingItem) {
      throw new ConflictException('Khóa học đã có trong giỏ hàng');
    }

    const item = await this.cartItemModel.create({ cartId: cart.id, courseId });
    await this.recalculateTotals(cart.id);
    return item;
  }

  /**
   * Remove a course from the user's cart
   */
  async removeItem(userId: number, courseId: number): Promise<void> {
    const cart = await this.cartModel.findOne({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Giỏ hàng không tồn tại');
    }

    const deleted = await this.cartItemModel.destroy({
      where: { cartId: cart.id, courseId },
    });

    if (!deleted) {
      throw new NotFoundException('Khóa học không có trong giỏ hàng');
    }

    await this.recalculateTotals(cart.id);
  }

  /**
   * Get the user's cart with items, total_quantity and total_amount
   */
  async getCart(userId: number): Promise<Cart> {
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

    return cart;
  }

  /**
   * Clear all items from the user's cart
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.cartModel.findOne({ where: { userId } });
    if (cart) {
      await this.cartItemModel.destroy({ where: { cartId: cart.id } });
      await this.cartModel.update(
        { totalQuantity: 0, totalAmount: 0 },
        { where: { id: cart.id } },
      );
    }
  }
}
