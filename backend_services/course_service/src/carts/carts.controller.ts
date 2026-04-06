import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  Req,
} from '@nestjs/common';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  /**
   * Get the current user's cart
   * userId is retrieved from the 'x-user-id' header (set by API Gateway)
   */
  @Get()
  async getCart(@Headers('x-user-id') userId: string) {
    return this.cartsService.getCart(Number(userId));
  }

  /**
   * Add a course to the cart
   */
  @Post('items')
  async addItem(
    @Headers('x-user-id') userId: string,
    @Body('courseId') courseId: number,
  ) {
    return this.cartsService.addItem(Number(userId), courseId);
  }

  /**
   * Remove a course from the cart
   */
  @Delete('items/:courseId')
  async removeItem(
    @Headers('x-user-id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.cartsService.removeItem(Number(userId), Number(courseId));
  }

  /**
   * Clear the entire cart
   */
  @Delete()
  async clearCart(@Headers('x-user-id') userId: string) {
    return this.cartsService.clearCart(Number(userId));
  }
}
