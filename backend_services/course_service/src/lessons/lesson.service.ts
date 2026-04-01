import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
// import { Lesson } from './models/lesson.model';
// import { LessonStatus } from './enums/lesson.enum';
import { Op } from 'sequelize';
import { Lesson, LessonStatus } from 'src/models/lesson.model';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
  ) { }

  async create(createLessonDto: CreateLessonDto): Promise<Lesson> {
    return await this.lessonModel.create({ ...createLessonDto });
  }

  async findAllByCourseId(courseId?: number | null): Promise<Lesson[]> {
    const whereCondition: any = {
      status: { [Op.ne]: LessonStatus.REMOVED }, // Bỏ qua các lesson đã bị xoá mềm
    };

    if (courseId || courseId == null) {
      whereCondition.courseId = courseId;
    }

    return await this.lessonModel.findAll({ where: whereCondition });
  }

  // async findAllByUserId(userId?: number): Promise<Lesson[]> {
  //   const whereCondition: any = {
  //     status: { [Op.ne]: LessonStatus.REMOVED }, // Bỏ qua các lesson đã bị xoá mềm
  //   };

  //   if (userId) {
  //     whereCondition.userId = userId;
  //   }

  //   return await this.lessonModel.findAll({ where: whereCondition });
  // }

  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.lessonModel.findByPk(id);
    if (!lesson || lesson.status === LessonStatus.REMOVED) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return lesson;
  }

  async update(id: number, updateLessonDto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.findOne(id); // Gọi hàm trên để check tồn tại
    return await lesson.update(updateLessonDto);
  }

  // Soft Delete
  async remove(id: number): Promise<void> {
    const lesson = await this.findOne(id);
    await lesson.update({ status: LessonStatus.REMOVED });
  }
}