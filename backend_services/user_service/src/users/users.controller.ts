import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
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
      throw new BadRequestException('User ID not found in request headers');
    }
    return this.usersService.getUserProfile(userId);
  }

  @Get(':id')
  // @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateUserDto,
    @Headers('x-user-id') requesterIdHeader: string,
    @Headers('x-user-role') requesterRoleHeader: string,
  ) {
    const requesterId = parseInt(requesterIdHeader, 10);
    const requesterRole = parseInt(requesterRoleHeader, 10);

    if (isNaN(requesterId) || isNaN(requesterRole)) {
      throw new BadRequestException('Requester context not found in request headers');
    }

    return this.usersService.updateUserById(id, payload, {
      userId: requesterId,
      role: requesterRole,
    });
  }

  @Patch('reset/:id')
  async resetUser(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') requesterIdHeader: string,
    @Headers('x-user-role') requesterRoleHeader: string,
  ) {
    const requesterId = parseInt(requesterIdHeader, 10);
    const requesterRole = parseInt(requesterRoleHeader, 10);

    if (isNaN(requesterId) || isNaN(requesterRole)) {
      throw new BadRequestException('Requester context not found in request headers');
    }

    return this.usersService.resetUserById(id, {
      userId: requesterId,
      role: requesterRole,
    });
  }
}
