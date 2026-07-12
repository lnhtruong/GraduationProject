import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
// import { Lesson } from './models/lesson.model';
// import { LessonStatus } from './enums/lesson.enum';
import { Op } from 'sequelize';
import { Lesson, LessonStatus } from 'src/models/lesson.model';
import { Video } from 'src/models/video.model';
import {
  PaginationMetaDto,
  PaginatedResponseDto,
} from 'src/models/pagination.dto';
import { GetLessonsQueryDto } from './dto/get-lessons-query.dto';
import { CoursesService } from 'src/course/course.service';
import { Course, CourseStatus } from 'src/models/course.model';
import { EnrollsService } from 'src/enrolls/enrolls.service';
import {
  CourseChangeRequest,
  CourseChangeRequestKind,
  LessonChangePayload,
} from 'src/models/course-change-request.model';

/** Ngữ cảnh người gọi (từ header x-user-id / x-user-role). */
export interface LessonRequester {
  userId?: number;
  role?: number;
}

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson)
    private readonly lessonModel: typeof Lesson,
    private readonly coursesService: CoursesService,
    private readonly enrollsService: EnrollsService,
  ) {}

  private readonly ADMIN_ROLE = 1;

  /**
   * true → phải đi qua change request (course đã publish VÀ requester không phải
   * admin). Admin có toàn quyền nên luôn sửa trực tiếp; course chưa publish cũng
   * sửa trực tiếp.
   */
  private async needsChangeRequest(
    courseId: number,
    requester?: LessonRequester,
  ): Promise<boolean> {
    if (requester?.role === this.ADMIN_ROLE) {
      return false;
    }
    // Check permission trước khi lộ tồn tại: non-admin không xác nhận được là
    // chủ khóa (khóa không tồn tại hoặc của người khác) → 403, không tiết lộ
    // khóa có tồn tại hay không.
    let course: Course;
    try {
      course = await this.coursesService.findOne(courseId);
    } catch {
      throw new ForbiddenException('You are not the owner of this course');
    }
    const ownerId = (course as Course & { userId?: number }).userId;
    if (ownerId !== requester?.userId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return this.requiresChangeRequest(course.status);
  }

  /**
   * Course ở các trạng thái này thì giảng viên sửa lesson phải đi qua change
   * request chờ admin duyệt: `publish` (đang live) và `approved` (admin đã duyệt
   * nội dung, sửa thì phải duyệt lại). draft/pending/rejected/banned sửa trực tiếp.
   */
  private requiresChangeRequest(status: CourseStatus): boolean {
    return status === CourseStatus.PUBLISH || status === CourseStatus.APPROVED;
  }

  /**
   * Xác thực quyền sửa/xóa một lesson đã có, theo nguyên tắc 403 TRƯỚC 404:
   * - Admin: full quyền; nếu lesson không tồn tại → 404.
   * - Non-admin: phải là chủ khóa của lesson. Không phải chủ — kể cả khi lesson
   *   hoặc khóa không tồn tại — đều nhận 403, không tiết lộ tồn tại.
   * Trả về lesson đã xác thực + cờ có cần đi qua change request hay không.
   */
  private async authorizeLessonMutation(
    id: number,
    requester?: LessonRequester,
  ): Promise<{ lesson: Lesson; needsChangeRequest: boolean }> {
    const lesson = await this.lessonModel.findByPk(id);
    const exists = !!lesson && lesson.status !== LessonStatus.REMOVED;

    if (requester?.role === this.ADMIN_ROLE) {
      if (!exists) {
        throw new NotFoundException(`Lesson with ID ${id} not found`);
      }
      return { lesson: lesson as Lesson, needsChangeRequest: false };
    }

    if (!exists || !lesson!.courseId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    let course: Course;
    try {
      course = await this.coursesService.findOne(lesson!.courseId);
    } catch {
      throw new ForbiddenException('You are not the owner of this course');
    }
    const ownerId = (course as Course & { userId?: number }).userId;
    if (ownerId !== requester?.userId) {
      throw new ForbiddenException('You are not the owner of this course');
    }
    return {
      lesson: lesson as Lesson,
      needsChangeRequest: this.requiresChangeRequest(course.status),
    };
  }

  /** requestedBy bắt buộc khi tạo change request (cột requested_by NOT NULL). */
  private requireRequester(requester?: LessonRequester): number {
    const userId = requester?.userId;
    if (!userId || !Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException(
        'User ID is required to request changes on a published course',
      );
    }
    return userId;
  }

  /**
   * Ảnh chụp giá trị lesson hiện tại cho đúng các field có trong `payload`,
   * cộng thêm các field bổ sung (nếu có) — dùng cho `lesson.delete`, nơi
   * payload chỉ có `{status}` nhưng FE cần `title`/`contentType` để hiển thị
   * lesson nào sắp bị xoá.
   */
  private snapshotLesson(
    lesson: Lesson,
    payload: LessonChangePayload,
    extraKeys: (keyof Lesson)[] = [],
  ): LessonChangePayload {
    const snapshot: Record<string, unknown> = {};
    for (const key of [...Object.keys(payload), ...extraKeys]) {
      snapshot[key] = lesson.get(key as keyof Lesson) ?? null;
    }
    return snapshot as LessonChangePayload;
  }

  async create(
    createLessonDto: CreateLessonDto,
    requester?: LessonRequester,
  ): Promise<Lesson | CourseChangeRequest> {
    // Course đã publish (và không phải admin) → tạo change request thay vì thêm
    // lesson trực tiếp.
    if (
      createLessonDto.courseId &&
      (await this.needsChangeRequest(createLessonDto.courseId, requester))
    ) {
      return await this.coursesService.createLessonChangeRequest({
        kind: CourseChangeRequestKind.LESSON_CREATE,
        courseId: createLessonDto.courseId,
        targetId: null,
        payload: { ...createLessonDto } as LessonChangePayload,
        prevData: null,
        requestedBy: this.requireRequester(requester),
      });
    }

    const lesson = await this.lessonModel.create({ ...createLessonDto });

    // Sync course duration + enroll progress after adding a new lesson so
    // enrollees' completion ratio reflects the new lesson set.
    if (lesson.courseId) {
      await this.coursesService.syncCourseDuration(lesson.courseId);
      await this.enrollsService.reconcileCourseEnrollProgress(lesson.courseId);
      // Admin thêm lesson trực tiếp trên khóa đã publish → báo học viên (no-op
      // nếu khóa chưa publish).
      await this.coursesService.notifyLessonChangeDirect(
        lesson.courseId,
        CourseChangeRequestKind.LESSON_CREATE,
        requester?.userId,
      );
    }

    return lesson;
  }

  async findAllByCourseId(
    query: GetLessonsQueryDto,
  ): Promise<PaginatedResponseDto<Lesson>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const courseId = query.courseId;

    const whereCondition: any = {
      status: { [Op.ne]: LessonStatus.REMOVED }, // Bỏ qua các lesson đã bị xoá mềm
    };

    if (courseId || courseId == null) {
      whereCondition.courseId = courseId;
    }

    const { rows, count } = await this.lessonModel.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Video,
          attributes: ['id', 'url', 'duration', 'thumbnail'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    return new PaginatedResponseDto(
      rows,
      new PaginationMetaDto(page, limit, count),
    );
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

  async update(
    id: number,
    updateLessonDto: UpdateLessonDto,
    requester?: LessonRequester,
  ): Promise<Lesson | CourseChangeRequest> {
    // Check permission trước khi lộ tồn tại (403 trước 404).
    const { lesson, needsChangeRequest: needsCR } =
      await this.authorizeLessonMutation(id, requester);

    // Course đã publish (và không phải admin) → tạo change request thay vì sửa
    // lesson trực tiếp.
    if (lesson.courseId && needsCR) {
      const payload = { ...updateLessonDto } as LessonChangePayload;
      return await this.coursesService.createLessonChangeRequest({
        kind: CourseChangeRequestKind.LESSON_UPDATE,
        courseId: lesson.courseId,
        targetId: lesson.id,
        payload,
        prevData: this.snapshotLesson(lesson, payload),
        requestedBy: this.requireRequester(requester),
      });
    }

    const updated = await lesson.update(updateLessonDto);

    if (updated.courseId) {
      // Duration có thể đổi theo nội dung lesson → luôn sync.
      await this.coursesService.syncCourseDuration(updated.courseId);
      // Progress chỉ phụ thuộc TẬP lesson đang active (mẫu số). Một update field
      // thường (title/content/duration...) không đổi tập đó nên bỏ qua reconcile
      // (tốn N transaction vô ích). Chỉ reconcile khi `status` đổi — vì lesson có
      // thể vào/ra trạng thái REMOVED, làm thay đổi mẫu số.
      if ('status' in updateLessonDto) {
        await this.enrollsService.reconcileCourseEnrollProgress(
          updated.courseId,
        );
      }
      // Admin sửa lesson trực tiếp trên khóa đã publish → báo học viên (no-op
      // nếu khóa chưa publish).
      await this.coursesService.notifyLessonChangeDirect(
        updated.courseId,
        CourseChangeRequestKind.LESSON_UPDATE,
        requester?.userId,
      );
    }

    return updated;
  }

  // Soft Delete
  async remove(
    id: number,
    requester?: LessonRequester,
  ): Promise<void | CourseChangeRequest> {
    // Check permission trước khi lộ tồn tại (403 trước 404).
    const { lesson, needsChangeRequest: needsCR } =
      await this.authorizeLessonMutation(id, requester);

    // Course đã publish (và không phải admin) → tạo change request thay vì xoá
    // mềm trực tiếp.
    if (lesson.courseId && needsCR) {
      const payload: LessonChangePayload = { status: LessonStatus.REMOVED };
      return await this.coursesService.createLessonChangeRequest({
        kind: CourseChangeRequestKind.LESSON_DELETE,
        courseId: lesson.courseId,
        targetId: lesson.id,
        payload,
        prevData: this.snapshotLesson(lesson, payload, ['title', 'contentType']),
        requestedBy: this.requireRequester(requester),
      });
    }

    await lesson.update({ status: LessonStatus.REMOVED });

    // Dọn pending request mồ côi trỏ tới lesson vừa xoá (an toàn kể cả khi
    // course chưa publish — khi đó không có request nào, đây là no-op).
    await this.coursesService.deletePendingRequestsForLesson(lesson.id);

    // Sync after soft-deleting so removed lesson is excluded from both course
    // duration and enrollees' completion ratio.
    if (lesson.courseId) {
      await this.coursesService.syncCourseDuration(lesson.courseId);
      await this.enrollsService.reconcileCourseEnrollProgress(lesson.courseId);
      // Admin xóa lesson trực tiếp trên khóa đã publish → báo học viên (no-op
      // nếu khóa chưa publish).
      await this.coursesService.notifyLessonChangeDirect(
        lesson.courseId,
        CourseChangeRequestKind.LESSON_DELETE,
        requester?.userId,
      );
    }
  }
}
