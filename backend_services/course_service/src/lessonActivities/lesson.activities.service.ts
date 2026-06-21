// src/models/lesson-activities/lesson-activities.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  ActivityStatus,
  LessonActivity,
} from 'src/models/lesson-activity.model';
import { CreateLessonActivityDto } from './dto/create-lesson-activities.dto';
import { UpdateLessonActivityDto } from './dto/update-lesson-activities.dto';
import { Lesson } from 'src/models/lesson.model';
import { CoursesService } from 'src/course/course.service';
import { Course } from 'src/models/course.model';

/** Ngữ cảnh người gọi (từ header x-user-id / x-user-role). */
export interface LessonActivityRequester {
  userId?: number;
  role?: number;
}

@Injectable()
export class LessonActivitiesService {
  constructor(
    @InjectModel(LessonActivity)
    private readonly lessonActivityModel: typeof LessonActivity,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    private readonly coursesService: CoursesService,
  ) {}

  private readonly ADMIN_ROLE = 1;

  /**
   * Chỉ admin hoặc chủ khóa (course chứa lesson) mới được tạo/sửa/xóa lesson
   * activity. KHÔNG chặn theo trạng thái publish — activity sửa trực tiếp ở mọi
   * trạng thái course; nội dung quiz mới đi qua change request riêng. Non-admin
   * không xác nhận được là chủ khóa (lesson/khóa không tồn tại hoặc của người
   * khác) → 403, không tiết lộ tồn tại.
   */
  private async assertOwnerOrAdmin(
    lessonId: number | null | undefined,
    requester?: LessonActivityRequester,
  ): Promise<void> {
    if (requester?.role === this.ADMIN_ROLE) return;

    if (!lessonId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    const lesson = await this.lessonModel.findByPk(lessonId, {
      attributes: ['id', 'courseId'],
    });
    if (!lesson?.courseId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    let course: Course;
    try {
      course = await this.coursesService.findOne(lesson.courseId);
    } catch {
      throw new ForbiddenException('You are not the owner of this course');
    }
    const ownerId = (course as Course & { userId?: number }).userId;
    if (ownerId !== requester?.userId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
  }

  // Lesson-activity (quiz container + assignment) sửa trực tiếp kể cả khi course
  // đã publish/approved: quiz container rỗng vô hại (nội dung quiz đi qua quiz
  // change request), còn assignment hiện chỉ là mục có tiêu đề nên không cần duyệt.
  // Vẫn yêu cầu là chủ khóa hoặc admin để tránh chỉnh sửa khóa của người khác.
  async create(
    createLessonActivityDto: CreateLessonActivityDto,
    requester?: LessonActivityRequester,
  ): Promise<LessonActivity> {
    await this.assertOwnerOrAdmin(createLessonActivityDto.lessonId, requester);
    return await this.lessonActivityModel.create({
      ...createLessonActivityDto,
    });
  }

  // Lấy danh sách activity theo lessonId (bỏ qua những cái đã bị xóa)
  async findAllByLessonId(lessonId: number): Promise<LessonActivity[]> {
    return await this.lessonActivityModel.findAll({
      where: {
        lessonId,
        status: { [Op.ne]: ActivityStatus.REMOVED },
      },
      order: [['orderIndex', 'ASC']],
    });
  }

  async findAllByUserId(userId: number): Promise<LessonActivity[]> {
    return await this.lessonActivityModel.findAll({
      where: {
        createdBy: userId,
        status: { [Op.ne]: ActivityStatus.REMOVED },
      },
      order: [['orderIndex', 'ASC']],
    });
  }

  async findOne(id: number): Promise<LessonActivity> {
    const activity = await this.lessonActivityModel.findByPk(id);
    if (!activity || activity.status === ActivityStatus.REMOVED) {
      throw new NotFoundException(`Lesson Activity with ID ${id} not found`);
    }
    return activity;
  }

  async update(
    id: number,
    updateLessonActivityDto: UpdateLessonActivityDto,
    requester?: LessonActivityRequester,
  ): Promise<LessonActivity> {
    const activity = await this.findOne(id);
    await this.assertOwnerOrAdmin(activity.lessonId, requester);
    return await activity.update(updateLessonActivityDto);
  }

  // Soft Delete
  async remove(id: number, requester?: LessonActivityRequester): Promise<void> {
    const activity = await this.findOne(id);
    await this.assertOwnerOrAdmin(activity.lessonId, requester);
    await activity.update({ status: ActivityStatus.REMOVED });
  }
}
