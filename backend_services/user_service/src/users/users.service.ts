import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from './user.model';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit_logs/audit-logs.service';

export interface RequesterContext {
  userId: number;
  role: number;
  ip?: string | null;
  userAgent?: string | null;
}

export enum UserRole {
  ADMIN = 1,
  STUDENT = 2,
  LECTURER = 3,
}

@Injectable()
export class UsersService {
  private static readonly PASSWORD_SALT_ROUNDS = 10;

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly auditLogsService: AuditLogsService,
    private readonly configService: ConfigService,
  ) { }

  private auditableUserSnapshot(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isBanned: user.isBanned,
      emailVerified: (user as User & { emailVerified?: boolean }).emailVerified ?? null,
    };
  }

  private toPublicUser(user: User | Record<string, any>) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
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
    requester: RequesterContext,
  ) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Chỉ admin mới có quyền đổi role.
    if (payload.role !== undefined && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update role');
    }

    const before = this.auditableUserSnapshot(user);

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

    // Audit only when an admin acts on someone else, or any role change occurred.
    // Self-updates by non-admin (e.g. avatar) are not interesting audit material.
    const roleChanged = payload.role !== undefined && before.role !== user.role;
    const adminActingOnOther =
      requester.role === UserRole.ADMIN && requester.userId !== userId;
    if (adminActingOnOther || roleChanged) {
      const after = this.auditableUserSnapshot(user);
      await this.auditLogsService.log({
        actorUserId: requester.userId,
        actorRole: requester.role,
        action: roleChanged ? 'user.role.update' : 'user.update',
        targetType: 'user',
        targetId: user.id,
        before,
        after,
        metadata: {
          fieldsChanged: Object.keys(payload).filter(
            (k) => k !== 'password',
          ),
        },
        ip: requester.ip ?? null,
        userAgent: requester.userAgent ?? null,
      });
    }

    return this.getUserById(userId);
  }

  async resetUserById(
    userId: number,
    requester: RequesterContext,
  ) {
    if (requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can reset user');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultResetPassword = this.configService.get<string>(
      'DEFAULT_RESET_PASSWORD',
    );
    if (!defaultResetPassword) {
      throw new InternalServerErrorException(
        'DEFAULT_RESET_PASSWORD is not configured',
      );
    }

    const hashedDefaultPassword = await bcrypt.hash(
      defaultResetPassword,
      UsersService.PASSWORD_SALT_ROUNDS,
    );

    await user.update({ password: hashedDefaultPassword });

    await this.auditLogsService.log({
      actorUserId: requester.userId,
      actorRole: requester.role,
      action: 'user.password_reset',
      targetType: 'user',
      targetId: user.id,
      metadata: { resetTo: 'default' },
      ip: requester.ip ?? null,
      userAgent: requester.userAgent ?? null,
    });

    return {
      message: 'User password has been reset to default value',
      user: await this.getUserById(userId),
    };
  }
}
