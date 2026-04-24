// src/models/lesson-activities/lesson-activities.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ActivityStatus, ActivityType, LessonActivity } from 'src/models/lesson-activity.model';
import { CreateLessonActivityDto } from './dto/create-lesson-activities.dto';
import { UpdateLessonActivityDto } from './dto/update-lesson-activities.dto';
import { Lesson } from 'src/models/lesson.model';
import { CoursesService } from 'src/course/course.service';
import { CourseStatus } from 'src/models/course.model';
// import { CreateLessonActivityDto } from './dto/create-lesson-activity.dto';
// import { UpdateLessonActivityDto } from './dto/update-lesson-activity.dto';
// import { LessonActivity } from './models/lesson-activity.model';
// import { ActivityStatus } from './enums/lesson-activity.enum';

@Injectable()
export class LessonActivitiesService {
  constructor(
    @InjectModel(LessonActivity)
    private readonly lessonActivityModel: typeof LessonActivity,
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    private readonly coursesService: CoursesService,
  ) { }

  private async assertCourseNotPublished(lessonId: number): Promise<void> {
    const lesson = await this.lessonModel.findByPk(lessonId);
    if (!lesson) return;
    if (!lesson.courseId) return;
    const course = await this.coursesService.findOne(lesson.courseId);
    if (course.status === CourseStatus.PUBLISH) {
      throw new BadRequestException(
        'Cannot modify lesson activities of a published course. Only quiz edits are allowed after publishing.',
      );
    }
  }

  async create(createLessonActivityDto: CreateLessonActivityDto): Promise<LessonActivity> {
    console.log('check dto: ', CreateLessonActivityDto);
    if (createLessonActivityDto.lessonId) {
      await this.assertCourseNotPublished(createLessonActivityDto.lessonId);
    }
    return await this.lessonActivityModel.create({ ...createLessonActivityDto });
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

  async update(id: number, updateLessonActivityDto: UpdateLessonActivityDto): Promise<LessonActivity> {
    const activity = await this.findOne(id);
    // Quiz activities are still editable after course is published
    if (activity.lessonId && activity.activityType !== ActivityType.QUIZ) {
      await this.assertCourseNotPublished(activity.lessonId);
    }
    return await activity.update(updateLessonActivityDto);
  }

  // Soft Delete
  async remove(id: number): Promise<void> {
    const activity = await this.findOne(id);
    if (activity.lessonId) {
      await this.assertCourseNotPublished(activity.lessonId);
    }
    await activity.update({ status: ActivityStatus.REMOVED });
  }
}