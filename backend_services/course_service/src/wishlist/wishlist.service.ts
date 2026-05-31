import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { literal } from 'sequelize';
import { Wishlist } from '../models/wishlist.model';
import { Course, CourseStatus } from '../models/course.model';
import { User } from '../users/user.model';

export interface CourseCardSnapshot {
  id: number;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: string;
  language: string;
  duration: string;
  price: number;
  status: string;
  instructor: { id: number; name: string; avatarUrl: string | null } | null;
  avgRating: number;
  reviewCount: number;
  enrollCount: number;
}

export interface WishlistItemSnapshot extends CourseCardSnapshot {
  addedAt: Date;
}

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist) private readonly wishlistModel: typeof Wishlist,
    @InjectModel(Course) private readonly courseModel: typeof Course,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  private serialiseInstructor(user?: User | null): CourseCardSnapshot['instructor'] {
    if (!user) return null;
    const first = (user as any).firstName ?? '';
    const last = (user as any).lastName ?? '';
    const name = `${first} ${last}`.trim() || (user as any).email || 'Instructor';
    return {
      id: (user as any).id,
      name,
      avatarUrl: (user as any).avatarUrl ?? null,
    };
  }

  private serialiseCourse(course: Course, raw: any): CourseCardSnapshot {
    return {
      id: course.id,
      name: (course as any).name,
      description: (course as any).description ?? null,
      thumbnailUrl: (course as any).thumbnailUrl ?? null,
      level: (course as any).level,
      language: (course as any).language,
      duration: (course as any).duration,
      price: Number((course as any).price ?? 0),
      status: (course as any).status,
      instructor: this.serialiseInstructor((course as any).instructor),
      avgRating: Number(raw?.avgRating ?? 0),
      reviewCount: Number(raw?.reviewCount ?? 0),
      enrollCount: Number(raw?.enrollCount ?? 0),
    };
  }

  async list(
    userId: number,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    data: WishlistItemSnapshot[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const offset = (page - 1) * limit;

    const { rows, count } = await this.wishlistModel.findAndCountAll({
      where: { userId },
      include: [
        {
          model: this.courseModel,
          required: true,
          attributes: {
            include: [
              [
                literal(
                  '(SELECT COALESCE(AVG(rating), 0) FROM feedbacks WHERE feedbacks.course_id = `course`.`id` AND feedbacks.is_visible = 1)',
                ),
                'avgRating',
              ],
              [
                literal(
                  '(SELECT COUNT(*) FROM feedbacks WHERE feedbacks.course_id = `course`.`id` AND feedbacks.is_visible = 1)',
                ),
                'reviewCount',
              ],
              [
                literal(
                  '(SELECT COUNT(*) FROM enrolls WHERE enrolls.course_id = `course`.`id`)',
                ),
                'enrollCount',
              ],
            ],
          },
        },
      ],
      order: [['added_at', 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    // Batch-fetch instructor info to avoid N+1.
    const instructorIds = Array.from(
      new Set(
        rows
          .map((r) => ((r as any).Course ?? (r as any).course)?.userId)
          .filter((id) => typeof id === 'number'),
      ),
    );
    const instructors = instructorIds.length
      ? await this.userModel.findAll({
          where: { id: instructorIds },
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        })
      : [];
    const instructorById = new Map<number, User>(
      instructors.map((u) => [(u as any).id, u]),
    );

    const data: WishlistItemSnapshot[] = rows.map((row) => {
      const course: any = (row as any).Course ?? (row as any).course;
      const raw = course && typeof course.get === 'function'
        ? course.get({ plain: true })
        : course;
      const instructor = instructorById.get((course as any).userId);
      (course as any).instructor = instructor;
      return {
        ...this.serialiseCourse(course, raw),
        addedAt: row.addedAt,
      };
    });

    return { data, total: count, page, limit };
  }

  async add(userId: number, courseId: number): Promise<{ inWishlist: true; courseId: number }> {
    const course = await this.courseModel.findByPk(courseId, {
      attributes: ['id', 'status'],
    });
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }
    if ((course as any).status !== CourseStatus.PUBLISH) {
      throw new BadRequestException(
        'Only published courses can be added to the wishlist',
      );
    }

    await this.wishlistModel.findOrCreate({
      where: { userId, courseId },
      defaults: { userId, courseId, addedAt: new Date() },
    });
    return { inWishlist: true, courseId };
  }

  async remove(userId: number, courseId: number): Promise<void> {
    const deleted = await this.wishlistModel.destroy({
      where: { userId, courseId },
    });
    if (deleted === 0) {
      throw new NotFoundException(
        `Course ${courseId} is not in your wishlist`,
      );
    }
  }

  async check(userId: number, courseId: number): Promise<{ inWishlist: boolean }> {
    const found = await this.wishlistModel.findOne({
      where: { userId, courseId },
      attributes: ['id'],
    });
    return { inWishlist: !!found };
  }
}
