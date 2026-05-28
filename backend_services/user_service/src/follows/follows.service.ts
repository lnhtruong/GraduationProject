import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes, UniqueConstraintError } from 'sequelize';
import { InstructorFollow } from '../models/instructor-follow.model';
import { User } from '../users/user.model';

const LECTURER_ROLE = 3;

export interface InstructorStats {
  followerCount: number;
  courseCount: number;
  isFollowing?: boolean;
}

export interface InstructorBrief {
  id: number;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  followerCount: number;
  courseCount: number;
}

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(InstructorFollow)
    private readonly followModel: typeof InstructorFollow,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  private buildName(user: User | null): string {
    if (!user) return 'Instructor';
    const first = (user as any).firstName ?? '';
    const last = (user as any).lastName ?? '';
    return `${first} ${last}`.trim() || (user as any).email || 'Instructor';
  }

  private async assertIsLecturer(instructorId: number): Promise<User> {
    const user = await this.userModel.findByPk(instructorId, {
      attributes: ['id', 'role', 'firstName', 'lastName', 'avatarUrl', 'email'],
    });
    if (!user) {
      throw new NotFoundException(`User ${instructorId} not found`);
    }
    if ((user as any).role !== LECTURER_ROLE) {
      throw new BadRequestException(
        'You can only follow users with the lecturer role',
      );
    }
    return user;
  }

  async follow(followerId: number, instructorId: number): Promise<{ following: true }> {
    if (followerId === instructorId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    await this.assertIsLecturer(instructorId);
    try {
      await this.followModel.findOrCreate({
        where: { followerId, instructorId },
        defaults: { followerId, instructorId, followedAt: new Date() },
      });
    } catch (err) {
      if (!(err instanceof UniqueConstraintError)) throw err;
    }
    return { following: true };
  }

  async unfollow(followerId: number, instructorId: number): Promise<void> {
    const deleted = await this.followModel.destroy({
      where: { followerId, instructorId },
    });
    if (deleted === 0) {
      throw new NotFoundException(
        `You are not following user ${instructorId}`,
      );
    }
  }

  async stats(
    instructorId: number,
    viewerId?: number,
  ): Promise<InstructorStats> {
    const instructor = await this.userModel.findByPk(instructorId, {
      attributes: ['id', 'role'],
    });
    if (!instructor) {
      throw new NotFoundException(`User ${instructorId} not found`);
    }
    if ((instructor as any).role !== LECTURER_ROLE) {
      throw new NotFoundException(`User ${instructorId} is not an instructor`);
    }

    const [followerCount, courseCount, viewerFollow] = await Promise.all([
      this.followModel.count({ where: { instructorId } }),
      this.sequelize
        .query<{ c: number }>(
          'SELECT COUNT(*) AS c FROM courses WHERE user_id = :uid',
          { type: QueryTypes.SELECT, replacements: { uid: instructorId } },
        )
        .then((rows) => Number(rows[0]?.c ?? 0)),
      viewerId !== undefined && viewerId !== instructorId
        ? this.followModel.findOne({
            where: { followerId: viewerId, instructorId },
            attributes: ['id'],
          })
        : Promise.resolve(null),
    ]);

    const out: InstructorStats = { followerCount, courseCount };
    if (viewerId !== undefined) {
      out.isFollowing = viewerId === instructorId ? false : !!viewerFollow;
    }
    return out;
  }

  async listFollowing(
    userId: number,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    data: InstructorBrief[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await this.followModel.findAndCountAll({
      where: { followerId: userId },
      include: [
        {
          model: this.userModel,
          as: 'instructor',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email'],
          required: true,
        },
      ],
      order: [['followed_at', 'DESC']],
      limit,
      offset,
    });

    const instructorIds = rows.map((r) => r.instructorId);
    const courseCounts = instructorIds.length
      ? await this.sequelize.query<{ user_id: number; c: number }>(
          'SELECT user_id, COUNT(*) AS c FROM courses WHERE user_id IN (:ids) GROUP BY user_id',
          { type: QueryTypes.SELECT, replacements: { ids: instructorIds } },
        )
      : [];
    const courseCountById = new Map<number, number>(
      courseCounts.map((c) => [Number(c.user_id), Number(c.c)]),
    );

    const followerCounts = instructorIds.length
      ? await this.followModel.findAll({
          where: { instructorId: instructorIds },
          attributes: [
            'instructorId',
            [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'c'],
          ],
          group: ['instructorId'],
          raw: true,
        })
      : [];
    const followerCountById = new Map<number, number>(
      (followerCounts as any[]).map((f) => [Number(f.instructorId), Number(f.c)]),
    );

    const data: InstructorBrief[] = rows.map((row) => {
      const u = (row as any).instructor as User | null;
      return {
        id: row.instructorId,
        name: this.buildName(u),
        avatarUrl: (u as any)?.avatarUrl ?? null,
        email: (u as any)?.email ?? null,
        followerCount: followerCountById.get(row.instructorId) ?? 0,
        courseCount: courseCountById.get(row.instructorId) ?? 0,
      };
    });

    return { data, total: count, page, limit };
  }
}
