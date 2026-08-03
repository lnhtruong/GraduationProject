import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../users/user.model';
import { UserRole } from '../users/users.service';
import { CreateLecturerRequestDto } from './dto/create-lecturer-request.dto';
import { ReviewLecturerRequestDto } from './dto/review-lecturer-request.dto';
import {
  LecturerRequestStatus,
  LecturerUpgradeRequest,
} from './lecturer-request.model';
import { MascotImage, MascotImageType } from '../models/mascot-image.model';

@Injectable()
export class LecturerRequestsService {
  private readonly logger = new Logger(LecturerRequestsService.name);

  constructor(
    @InjectModel(LecturerUpgradeRequest)
    private readonly lecturerRequestModel: typeof LecturerUpgradeRequest,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(MascotImage)
    private readonly mascotImageModel: typeof MascotImage,
  ) {}

  async create(userId: number, payload: CreateLecturerRequestDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException(
        'Only students can request a lecturer upgrade',
      );
    }

    const existingPending = await this.lecturerRequestModel.findOne({
      where: { userId, status: LecturerRequestStatus.PENDING },
    });
    if (existingPending) {
      throw new ConflictException(
        'You already have a pending lecturer upgrade request',
      );
    }

    const evidenceImageIds = await this.validateEvidenceImages(
      userId,
      payload.evidenceImageIds,
    );

    return await this.lecturerRequestModel.create({
      userId,
      confirm: payload.confirm ?? null,
      evidenceImageIds,
      status: LecturerRequestStatus.PENDING,
    });
  }

  async listMine(
    userId: number,
    params: { page?: number; limit?: number; status?: LecturerRequestStatus },
  ) {
    const { offset, limit, page } = this.paginate(params.page, params.limit);

    const where: Record<string, unknown> = { userId };
    if (params.status) where.status = params.status;

    const { rows, count } = await this.lecturerRequestModel.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset,
      limit,
    });

    return this.buildPage(rows, count, page, limit);
  }

  async listAll(params: {
    page?: number;
    limit?: number;
    status?: LecturerRequestStatus;
  }) {
    const { offset, limit, page } = this.paginate(params.page, params.limit);

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;

    const { rows, count } = await this.lecturerRequestModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'avatarUrl'],
          required: false,
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      offset,
      limit,
    });

    return this.buildPage(rows, count, page, limit);
  }

  async getById(id: number) {
    const request = await this.lecturerRequestModel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'avatarUrl'],
          required: false,
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          required: false,
        },
      ],
    });
    if (!request) {
      throw new NotFoundException(`Lecturer upgrade request ${id} not found`);
    }
    return this.withEvidenceImages(request);
  }

  async review(
    id: number,
    reviewerId: number,
    payload: ReviewLecturerRequestDto,
  ) {
    const request = await this.lecturerRequestModel.findByPk(id);
    if (!request) {
      throw new NotFoundException(`Lecturer upgrade request ${id} not found`);
    }
    if (request.status !== LecturerRequestStatus.PENDING) {
      throw new ConflictException('This request has already been reviewed');
    }

    const nextStatus = payload.approve
      ? LecturerRequestStatus.APPROVED
      : LecturerRequestStatus.REJECTED;

    if (payload.approve) {
      const requester = await this.userModel.findByPk(request.userId);
      if (!requester) {
        throw new NotFoundException('Requester account no longer exists');
      }
      await requester.update({ role: UserRole.LECTURER });
    }

    await request.update({
      status: nextStatus,
      reviewerId,
      reviewNote: payload.reviewNote ?? null,
      reviewedAt: new Date(),
    });

    this.emitReviewNotification(request.userId, request.id, payload.approve, payload.reviewNote);

    return this.getById(id);
  }

  private async emitReviewNotification(
    userId: number,
    requestId: number,
    approved: boolean,
    reviewNote?: string,
  ): Promise<void> {
    const mediaServiceUrl =
      process.env.MEDIA_SERVICE_URL || 'http://localhost:8003';
    const body = {
      userId,
      eventType: approved
        ? 'lecturer_request.approved'
        : 'lecturer_request.rejected',
      sseEventType: 'notify:lecturer-request',
      title: approved
        ? 'Yêu cầu trở thành giảng viên đã được duyệt'
        : 'Yêu cầu trở thành giảng viên đã bị từ chối',
      message: reviewNote ?? null,
      payload: {
        requestId,
        approved,
        reviewNote: reviewNote ?? null,
        redirectUrl: '/profile',
      },
      sourceType: 'lecturer_request',
      sourceId: requestId,
    };
    const secret = process.env.INTERNAL_SERVICE_SECRET;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (secret) headers['x-internal-secret'] = secret;

    try {
      const res = await fetch(`${mediaServiceUrl}/notifications/internal`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.warn(
          `Notification dispatch failed (${res.status}): ${text}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Notification dispatch error: ${(err as Error).message}`,
      );
    }
  }

  private async validateEvidenceImages(userId: number, imageIds: number[]): Promise<number[]> {
    const images = await this.mascotImageModel.findAll({
      where: {
        image_id: { [Op.in]: imageIds },
        user_id: userId,
        type: MascotImageType.ROLE_UPGRADE,
      },
      attributes: ['image_id'],
    });
    if (images.length !== imageIds.length) {
      throw new ForbiddenException(
        'Ảnh minh chứng không tồn tại, không thuộc về bạn hoặc không đúng loại role_upgrade',
      );
    }
    return imageIds;
  }

  private async withEvidenceImages(request: LecturerUpgradeRequest) {
    const plain = request.get({ plain: true }) as LecturerUpgradeRequest & {
      evidenceImageIds?: number[] | null;
    };
    const imageIds = plain.evidenceImageIds ?? [];
    if (imageIds.length === 0) return { ...plain, evidenceImages: [] };

    const images = await this.mascotImageModel.findAll({
      where: { image_id: { [Op.in]: imageIds } },
      attributes: ['image_id', 'url', 'name', 'format', 'type'],
    });
    const byId = new Map(
      images.map((image) => [
        image.image_id,
        {
          imageId: image.image_id,
          url: image.url,
          name: image.name,
          format: image.format,
          type: image.type,
        },
      ]),
    );
    return {
      ...plain,
      evidenceImages: imageIds.map((imageId) => byId.get(imageId)).filter(Boolean),
    };
  }

  private paginate(page?: number, limit?: number) {
    const safePage =
      Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
    const safeLimit =
      Number.isInteger(limit) && (limit as number) > 0
        ? Math.min(limit as number, 100)
        : 20;
    return {
      page: safePage,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
    };
  }

  private async buildPage(
    rows: LecturerUpgradeRequest[],
    count: number,
    page: number,
    limit: number,
  ) {
    return {
      items: await Promise.all(rows.map((r) => this.withEvidenceImages(r))),
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}
