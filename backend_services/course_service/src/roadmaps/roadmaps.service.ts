import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Course } from 'src/models/course.model';
import {
  RoadMapCourse,
  RoadMapCourseStatus,
} from 'src/models/roadmap-course.model';
import { RoadMap } from 'src/models/roadmap.model';
import { User } from 'src/users/user.model';
import { AddRoadMapCourseDto } from './dto/add-roadmap-course.dto';
import { CreateRoadMapDto } from './dto/create-roadmap.dto';
import { UpdateRoadMapCourseDto } from './dto/update-roadmap-course.dto';
import { UpdateRoadMapDto } from './dto/update-roadmap.dto';

@Injectable()
export class RoadmapsService {
  constructor(
    @InjectModel(RoadMap)
    private readonly roadMapModel: typeof RoadMap,
    @InjectModel(RoadMapCourse)
    private readonly roadMapCourseModel: typeof RoadMapCourse,
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async create(createRoadMapDto: CreateRoadMapDto): Promise<RoadMap> {
    if (createRoadMapDto.userId !== undefined) {
      await this.ensureUserExists(createRoadMapDto.userId);
    }

    const roadMap = await this.roadMapModel.create({
      userId: createRoadMapDto.userId ?? null,
      name: createRoadMapDto.name,
      description: createRoadMapDto.description ?? null,
      totalCourses: 0,
      progress: 0,
    });

    return await this.findOne(roadMap.id);
  }

  async findAll(
    userId?: number,
    page?: number,
    limit?: number,
  ): Promise<
    | RoadMap[]
    | {
        data: RoadMap[];
        pagination: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
        };
      }
  > {
    const whereCondition: Record<string, unknown> = {};

    if (typeof userId === 'number' && !Number.isNaN(userId)) {
      whereCondition.userId = userId;
    }

    const shouldPaginate = page !== undefined || limit !== undefined;

    if (!shouldPaginate) {
      const roadmaps = await this.roadMapModel.findAll({
        where: whereCondition,
        include: this.getRoadMapInclude(),
        order: [['id', 'DESC']],
      });

      return roadmaps.map((roadmap) => this.sortRoadMapCourses(roadmap));
    }

    const safePage = Number.isInteger(page) && page! > 0 ? page! : 1;
    const safeLimit =
      Number.isInteger(limit) && limit! > 0 ? Math.min(limit!, 100) : 10;
    const offset = (safePage - 1) * safeLimit;

    const { rows, count } = await this.roadMapModel.findAndCountAll({
      where: whereCondition,
      include: this.getRoadMapInclude(),
      distinct: true,
      offset,
      limit: safeLimit,
      order: [['id', 'DESC']],
    });

    return {
      data: rows.map((roadmap) => this.sortRoadMapCourses(roadmap)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async findOne(id: number): Promise<RoadMap> {
    const roadMap = await this.roadMapModel.findByPk(id, {
      include: this.getRoadMapInclude(),
    });

    if (!roadMap) {
      throw new NotFoundException(`RoadMap with ID ${id} not found`);
    }

    return this.sortRoadMapCourses(roadMap);
  }

  async update(id: number, updateRoadMapDto: UpdateRoadMapDto): Promise<RoadMap> {
    const roadMap = await this.getRoadMapOrThrow(id);

    if (updateRoadMapDto.userId !== undefined) {
      await this.ensureUserExists(updateRoadMapDto.userId);
    }

    await roadMap.update({
      userId: updateRoadMapDto.userId ?? roadMap.userId ?? null,
      name: updateRoadMapDto.name ?? roadMap.name,
      description:
        updateRoadMapDto.description !== undefined
          ? updateRoadMapDto.description
          : roadMap.description ?? null,
    });

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const roadMap = await this.getRoadMapOrThrow(id, transaction);

      await this.roadMapCourseModel.destroy({
        where: { roadmapId: roadMap.id },
        transaction,
      });

      await roadMap.destroy({ transaction });
    });
  }

  async addCourse(
    roadMapId: number,
    addRoadMapCourseDto: AddRoadMapCourseDto,
  ): Promise<RoadMapCourse> {
    return await this.sequelize.transaction(async (transaction) => {
      const roadMap = await this.getRoadMapOrThrow(roadMapId, transaction);
      await this.ensureCourseExists(addRoadMapCourseDto.courseId, transaction);

      const existingAssociation = await this.roadMapCourseModel.findOne({
        where: {
          roadmapId: roadMap.id,
          courseId: addRoadMapCourseDto.courseId,
        },
        transaction,
      });

      if (existingAssociation) {
        throw new ConflictException('Course already exists in this roadmap');
      }

      const nextOrderIndex = await this.getNextOrderIndex(
        roadMap.id,
        transaction,
      );
      const targetOrderIndex = this.normalizeOrderIndex(
        addRoadMapCourseDto.orderIndex ?? nextOrderIndex,
        nextOrderIndex,
      );

      await this.shiftOrderIndexOnInsert(
        roadMap.id,
        targetOrderIndex,
        transaction,
      );

      const roadMapCourse = await this.roadMapCourseModel.create(
        {
          roadmapId: roadMap.id,
          courseId: addRoadMapCourseDto.courseId,
          orderIndex: targetOrderIndex,
          status: addRoadMapCourseDto.status ?? null,
        },
        { transaction },
      );

      await this.syncRoadMapCounters(roadMap.id, transaction);

      return (await this.roadMapCourseModel.findByPk(roadMapCourse.id, {
        include: [Course],
        transaction,
      })) as RoadMapCourse;
    });
  }

  async updateCourse(
    roadMapId: number,
    courseId: number,
    updateRoadMapCourseDto: UpdateRoadMapCourseDto,
  ): Promise<RoadMapCourse> {
    return await this.sequelize.transaction(async (transaction) => {
      const roadMapCourse = await this.getRoadMapCourseOrThrow(
        roadMapId,
        courseId,
        transaction,
      );

      if (updateRoadMapCourseDto.orderIndex !== undefined) {
        const currentOrderIndex = roadMapCourse.orderIndex ?? 1;
        const targetOrderIndex = this.normalizeOrderIndex(
          updateRoadMapCourseDto.orderIndex,
          await this.getRoadMapCourseCount(roadMapId, transaction),
        );

        if (targetOrderIndex !== currentOrderIndex) {
          await this.reorderRoadMapCourses(
            roadMapId,
            currentOrderIndex,
            targetOrderIndex,
            transaction,
          );
          roadMapCourse.orderIndex = targetOrderIndex;
        }
      }

      if (updateRoadMapCourseDto.status !== undefined) {
        roadMapCourse.status = updateRoadMapCourseDto.status;
      }

      await roadMapCourse.save({ transaction });
      await this.syncRoadMapCounters(roadMapId, transaction);

      return (await this.roadMapCourseModel.findByPk(roadMapCourse.id, {
        include: [Course],
        transaction,
      })) as RoadMapCourse;
    });
  }

  async removeCourse(roadMapId: number, courseId: number): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const roadMapCourse = await this.getRoadMapCourseOrThrow(
        roadMapId,
        courseId,
        transaction,
      );

      await this.roadMapCourseModel.destroy({
        where: { id: roadMapCourse.id },
        transaction,
      });

      const removedOrderIndex = roadMapCourse.orderIndex ?? 0;
      await this.roadMapCourseModel.decrement(
        { orderIndex: 1 },
        {
          where: {
            roadmapId: roadMapId,
            orderIndex: {
              [Op.gt]: removedOrderIndex,
            },
          },
          transaction,
        },
      );

      await this.syncRoadMapCounters(roadMapId, transaction);
    });
  }

  private getRoadMapInclude() {
    return [
      {
        model: RoadMapCourse,
        include: [Course],
      },
    ];
  }

  private sortRoadMapCourses(roadMap: RoadMap): RoadMap {
    if (roadMap.roadmapCourses?.length) {
      roadMap.roadmapCourses = [...roadMap.roadmapCourses].sort((left, right) => {
        const leftOrder = left.orderIndex ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.orderIndex ?? Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.id - right.id;
      });
    }

    return roadMap;
  }

  private async ensureUserExists(
    userId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const user = await this.userModel.findByPk(userId, { transaction });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  private async ensureCourseExists(
    courseId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const course = await this.courseModel.findByPk(courseId, { transaction });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
  }

  private async getRoadMapOrThrow(
    id: number,
    transaction?: Transaction,
  ): Promise<RoadMap> {
    const roadMap = await this.roadMapModel.findByPk(id, { transaction });

    if (!roadMap) {
      throw new NotFoundException(`RoadMap with ID ${id} not found`);
    }

    return roadMap;
  }

  private async getRoadMapCourseOrThrow(
    roadMapId: number,
    courseId: number,
    transaction?: Transaction,
  ): Promise<RoadMapCourse> {
    const roadMapCourse = await this.roadMapCourseModel.findOne({
      where: { roadmapId: roadMapId, courseId },
      transaction,
    });

    if (!roadMapCourse) {
      throw new NotFoundException(
        `Course ${courseId} is not attached to roadmap ${roadMapId}`,
      );
    }

    return roadMapCourse;
  }

  private async getRoadMapCourseCount(
    roadMapId: number,
    transaction?: Transaction,
  ): Promise<number> {
    return await this.roadMapCourseModel.count({
      where: { roadmapId: roadMapId },
      transaction,
    });
  }

  private async getNextOrderIndex(
    roadMapId: number,
    transaction?: Transaction,
  ): Promise<number> {
    const count = await this.getRoadMapCourseCount(roadMapId, transaction);
    return count + 1;
  }

  private normalizeOrderIndex(targetIndex: number, maxIndex: number): number {
    if (!Number.isInteger(targetIndex) || targetIndex < 1) {
      throw new BadRequestException('orderIndex must be a positive integer');
    }

    return Math.min(targetIndex, Math.max(maxIndex, 1));
  }

  private async shiftOrderIndexOnInsert(
    roadMapId: number,
    targetIndex: number,
    transaction?: Transaction,
  ): Promise<void> {
    await this.roadMapCourseModel.increment(
      { orderIndex: 1 },
      {
        where: {
          roadmapId: roadMapId,
          orderIndex: {
            [Op.gte]: targetIndex,
          },
        },
        transaction,
      },
    );
  }

  private async reorderRoadMapCourses(
    roadMapId: number,
    currentIndex: number,
    targetIndex: number,
    transaction?: Transaction,
  ): Promise<void> {
    if (targetIndex < currentIndex) {
      await this.roadMapCourseModel.increment(
        { orderIndex: 1 },
        {
          where: {
            roadmapId: roadMapId,
            orderIndex: {
              [Op.gte]: targetIndex,
              [Op.lt]: currentIndex,
            },
          },
          transaction,
        },
      );
      return;
    }

    await this.roadMapCourseModel.decrement(
      { orderIndex: 1 },
      {
        where: {
          roadmapId: roadMapId,
          orderIndex: {
            [Op.gt]: currentIndex,
            [Op.lte]: targetIndex,
          },
        },
        transaction,
      },
    );
  }

  private async syncRoadMapCounters(
    roadMapId: number,
    transaction?: Transaction,
  ): Promise<void> {
    const totalCourses = await this.roadMapCourseModel.count({
      where: { roadmapId: roadMapId },
      transaction,
    });

    const progress = await this.roadMapCourseModel.count({
      where: {
        roadmapId: roadMapId,
        status: RoadMapCourseStatus.FINISH,
      },
      transaction,
    });

    await this.roadMapModel.update(
      {
        totalCourses,
        progress,
      },
      {
        where: { id: roadMapId },
        transaction,
      },
    );
  }
}