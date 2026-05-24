import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { User } from './user.model';
import { UpdateUserDto } from './dto/update-user.dto';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: number;
  isBanned?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

const USER_SORTABLE_COLUMNS = new Set([
  'createdAt',
  'email',
  'firstName',
  'lastName',
  'id',
]);

export enum UserRole {
  ADMIN = 1,
  STUDENT = 2,
  LECTURER = 3,
}

@Injectable()
export class UsersService {
  private static readonly PASSWORD_SALT_ROUNDS = 10;
  private static readonly DEFAULT_RESET_PASSWORD = 'fivetoneu2026';

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) { }

  private toPublicUser(user: User | Record<string, any>) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      isBanned: user.isBanned,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserProfile(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
      raw: true,
    });

    // console.log('check user: ', user);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async getUserById(userId: number) {
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async getAllUsers(params: ListUsersParams = {}) {
    const where: WhereOptions = {};

    if (params.search && params.search.trim().length > 0) {
      const keyword = `%${params.search.trim()}%`;
      (where as any)[Op.or] = [
        { email: { [Op.like]: keyword } },
        { firstName: { [Op.like]: keyword } },
        { lastName: { [Op.like]: keyword } },
      ];
    }

    if (Number.isInteger(params.role)) {
      (where as any).role = params.role;
    }

    if (typeof params.isBanned === 'boolean') {
      (where as any).isBanned = params.isBanned;
    }

    const sortBy = USER_SORTABLE_COLUMNS.has(params.sortBy ?? '')
      ? (params.sortBy as string)
      : 'id';
    const sortOrder =
      typeof params.sortOrder === 'string' &&
      params.sortOrder.toLowerCase() === 'desc'
        ? 'DESC'
        : 'ASC';

    const shouldPaginate =
      params.page !== undefined || params.limit !== undefined;

    if (!shouldPaginate) {
      const users = await this.userModel.findAll({
        where,
        attributes: { exclude: ['password'] },
        order: [[sortBy, sortOrder]],
      });
      return users.map((user) => this.toPublicUser(user));
    }

    const safePage =
      Number.isInteger(params.page) && (params.page as number) > 0
        ? (params.page as number)
        : 1;
    const safeLimit =
      Number.isInteger(params.limit) && (params.limit as number) > 0
        ? Math.min(params.limit as number, 100)
        : 15;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [[sortBy, sortOrder]],
      offset,
      limit: safeLimit,
    });

    return {
      data: rows.map((user) => this.toPublicUser(user)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async updateUserById(
    userId: number,
    payload: UpdateUserDto,
    requester: { userId: number; role: number },
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Chỉ admin mới có quyền đổi role.
    if (payload.role !== undefined && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update role');
    }

    // Chỉ admin mới có quyền ban / unban.
    if (payload.isBanned !== undefined && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can ban or unban a user');
    }

    const updatePayload: Partial<User> & { password?: string } = { ...payload };

    // Chỉ chính chủ mới được đổi password thông qua API update profile.
    if (payload.password !== undefined) {
      if (requester.userId !== userId) {
        throw new ForbiddenException('You can only update your own password');
      }

      updatePayload.password = await bcrypt.hash(
        payload.password,
        UsersService.PASSWORD_SALT_ROUNDS,
      );
    }

    await user.update(updatePayload);
    return this.getUserById(userId);
  }

  async resetUserById(
    userId: number,
    requester: { userId: number; role: number },
  ) {
    if (requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can reset user');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedDefaultPassword = await bcrypt.hash(
      UsersService.DEFAULT_RESET_PASSWORD,
      UsersService.PASSWORD_SALT_ROUNDS,
    );

    await user.update({ password: hashedDefaultPassword });

    return {
      message: 'User password has been reset to default value',
      user: await this.getUserById(userId),
    };
  }
}
