import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart)
    private cartModel: typeof Cart,
    @InjectModel(CartItem)
    private cartItemModel: typeof CartItem,
  ) {}

  /**
   * Get or create a cart for a user
   */
  async getOrCreateCart(userId: number): Promise<Cart> {
    const [cart] = await this.cartModel.findOrCreate({
      where: { userId },
      include: [CartItem],
    });
    return cart;
  }

  /**
   * Add a course to the user's cart
   */
  async addItem(userId: number, courseId: number): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.cartItemModel.findOne({
      where: { cartId: cart.id, courseId },
    });

    if (existingItem) {
      return existingItem;
    }

    return await this.cartItemModel.create({
      cartId: cart.id,
      courseId,
    });
  }

  /**
   * Remove a course from the user's cart
   */
  async removeItem(userId: number, courseId: number): Promise<void> {
    const cart = await this.cartModel.findOne({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const deleted = await this.cartItemModel.destroy({
      where: { cartId: cart.id, courseId },
    });

    if (!deleted) {
      throw new NotFoundException('Item not found in cart');
    }
  }

  /**
   * Get the user's cart with items
   */
  async getCart(userId: number): Promise<Cart> {
    const cart = await this.cartModel.findOne({
      where: { userId },
      include: [CartItem],
    });
    if (!cart) {
      return this.getOrCreateCart(userId);
    }
    return cart;
  }

  /**
   * Clear all items from the user's cart
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.cartModel.findOne({ where: { userId } });
    if (cart) {
      await this.cartItemModel.destroy({
        where: { cartId: cart.id },
      });
    }
  }
}
