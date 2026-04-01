import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  // @UseGuards(JwtAuthGuard)
  async getProfile(@Headers('x-user-id') userIdHeader: string) {
    // Get userId from header forwarded by gateway
    const userId = parseInt(userIdHeader, 10);

    console.log('check userid: ', userId);
    if (!userId || isNaN(userId)) {
      throw new Error('User ID not found in request headers');
    }
    return this.usersService.getUserProfile(userId);
  }

  @Get(':id')
  // @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }
}
