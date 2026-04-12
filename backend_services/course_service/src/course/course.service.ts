import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseStatus } from 'src/models/course.model';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    return await this.courseModel.create({
      ...createCourseDto,
      level: createCourseDto.level ?? undefined,
      status: createCourseDto.status ?? CourseStatus.DRAFT,
    });
  }

  async findAll(
    userId?: number,
    status?: CourseStatus,
    page?: number,
    limit?: number,
  ): Promise<
    | Course[]
    | {
        data: Course[];
        pagination: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
        };
      }
  > {
    const whereCondition: any = {};

    if (typeof userId === 'number' && !Number.isNaN(userId)) {
      whereCondition.userId = userId;
    }

    if (status) {
      whereCondition.status = status;
    } else {
      whereCondition.status = {
        [Op.ne]: CourseStatus.REJECTED,
      };
    }

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      return await this.courseModel.findAll({ where: whereCondition });
    }

    const safePage = Number.isInteger(page) && page! > 0 ? page! : 1;
    const safeLimit =
      Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, 100) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.courseModel.findAndCountAll({
      where: whereCondition,
      offset,
      limit: safeLimit,
      order: [['id', 'DESC']],
    });

    return {
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async findOne(id: number): Promise<Course> {
    const course = await this.courseModel.findByPk(id);
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    return await course.update(updateCourseDto);
  }

  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    await course.destroy();
  }
}
