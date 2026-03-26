// src/models/lesson-activities/lesson-activities.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ActivityStatus, LessonActivity } from 'src/models/lesson-activity.model';
import { CreateLessonActivityDto } from './dto/create-lesson-activities.dto';
import { UpdateLessonActivityDto } from './dto/update-lesson-activities.dto';
// import { CreateLessonActivityDto } from './dto/create-lesson-activity.dto';
// import { UpdateLessonActivityDto } from './dto/update-lesson-activity.dto';
// import { LessonActivity } from './models/lesson-activity.model';
// import { ActivityStatus } from './enums/lesson-activity.enum';

@Injectable()
export class LessonActivitiesService {
  constructor(
    @InjectModel(LessonActivity)
    private readonly lessonActivityModel: typeof LessonActivity,
  ) { }

  async create(createLessonActivityDto: CreateLessonActivityDto): Promise<LessonActivity> {
    console.log('check dto: ', CreateLessonActivityDto);
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
    return await activity.update(updateLessonActivityDto);
  }

  // Soft Delete
  async remove(id: number): Promise<void> {
    const activity = await this.findOne(id);
    await activity.update({ status: ActivityStatus.REMOVED });
  }
}