import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService, UserRole } from './users.service';
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
  async getAllUsers(
    @Headers('x-user-role') requesterRoleHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isBanned') isBanned?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const requesterRole = parseInt(requesterRoleHeader, 10);
    if (isNaN(requesterRole)) {
      throw new BadRequestException('Requester context not found in request headers');
    }
    if (requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can list users');
    }

    return this.usersService.getAllUsers({
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
      search,
      role: role !== undefined ? Number(role) : undefined,
      isBanned: this.parseOptionalBoolean(isBanned),
      sortBy,
      sortOrder,
    });
  }

  private parseOptionalBoolean(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    const normalized = value.toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return undefined;
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
