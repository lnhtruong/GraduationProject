import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  private resolveUserId(userId: string): number {
    if (!userId) {
      throw new UnauthorizedException('Vui lòng đăng nhập');
    }
    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException('User không hợp lệ');
    }
    return id;
  }

  /**
   * Get the current user's cart
   */
  @Get()
  async getCart(@Headers('x-user-id') userId: string) {
    const id = this.resolveUserId(userId);
    return this.cartsService.getCart(id);
  }

  /**
   * Add a course to the cart
   */
  @Post('items')
  async addItem(
    @Headers('x-user-id') userId: string,
    @Body('courseId') courseId: number,
    @Res() res: Response,
  ) {
    const id = this.resolveUserId(userId);
    if (!courseId || !Number.isInteger(Number(courseId)) || Number(courseId) <= 0) {
      throw new BadRequestException('courseId không hợp lệ');
    }
    const item = await this.cartsService.addItem(id, Number(courseId));
    return (res as any).status(201).json(item);
  }

  /**
   * Remove a course from the cart
   */
  @Delete('items/:courseId')
  async removeItem(
    @Headers('x-user-id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    const id = this.resolveUserId(userId);
    const cid = Number(courseId);
    if (!Number.isInteger(cid) || cid <= 0) {
      throw new BadRequestException('courseId không hợp lệ');
    }
    return this.cartsService.removeItem(id, cid);
  }

  /**
   * Clear the entire cart
   */
  @Delete()
  async clearCart(@Headers('x-user-id') userId: string) {
    const id = this.resolveUserId(userId);
    return this.cartsService.clearCart(id);
  }
}
