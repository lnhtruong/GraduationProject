import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Course } from 'src/models/course.model';
import { Feedback } from 'src/models/feedback.model';
import { User } from 'src/users/user.model';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectModel(Feedback) private readonly feedbackModel: typeof Feedback,
    @InjectModel(Course) private readonly courseModel: typeof Course,
  ) {}

  async create(userId: number, payload: CreateFeedbackDto): Promise<Feedback> {
    const course = await this.courseModel.findByPk(payload.courseId, {
      attributes: ['id', 'userId'],
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${payload.courseId} not found`);
    }
    if (course.userId === userId) {
      throw new ForbiddenException('Course owner cannot rate/review their own course');
    }

    const existed = await this.feedbackModel.findOne({
      where: { courseId: payload.courseId, userId },
    });
    if (existed) {
      throw new ConflictException('You have already reviewed this course');
    }

    return await this.feedbackModel.create({
      courseId: payload.courseId,
      userId,
      rating: payload.rating,
      reviewText: payload.reviewText,
      isVisible: true,
    });
  }

  async listByCourse(courseId: number, page = 1, limit = 10) {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new BadRequestException('courseId must be a positive integer');
    }

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.feedbackModel.findAndCountAll({
      where: { courseId, isVisible: true },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      offset,
      limit: safeLimit,
    });

    const allRatings = await this.feedbackModel.findAll({
      where: { courseId, isVisible: true },
      attributes: ['rating'],
    });
    const totalReviews = allRatings.length;
    const ratingCountMap = new Map<number, number>([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ]);

    let ratingSum = 0;
    for (const row of allRatings) {
      ratingSum += row.rating;
      ratingCountMap.set(row.rating, (ratingCountMap.get(row.rating) ?? 0) + 1);
    }

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const countForRating = ratingCountMap.get(rating) ?? 0;
      const percentage = totalReviews > 0 ? Math.round((countForRating / totalReviews) * 100) : 0;
      return { rating, count: countForRating, percentage };
    });

    return {
      summary: {
        averageRating,
        totalReviews,
        distribution,
      },
      items: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async updateByAdmin(id: number, payload: UpdateFeedbackDto): Promise<Feedback> {
    const feedback = await this.feedbackModel.findByPk(id);
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    await feedback.update(payload);
    return feedback;
  }

  async removeByAdmin(id: number): Promise<void> {
    const feedback = await this.feedbackModel.findByPk(id);
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    await feedback.destroy();
  }
}
