import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { UpdateUserDto } from './dto/update-user.dto';

export enum UserRole {
  ADMIN = 1,
  STUDENT = 2,
  LECTURER = 3,
}

@Injectable()
export class UsersService {
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

  async getAllUsers() {
    const users = await this.userModel.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
    });

    return users.map((user) => this.toPublicUser(user));
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

    await user.update(payload);
    return this.getUserById(userId);
  }
}
