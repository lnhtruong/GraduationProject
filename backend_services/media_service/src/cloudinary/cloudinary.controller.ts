import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import type { File as MulterFile } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CloudinaryService } from './cloudinary.service';

type UploadVideoType = 'highlight' | 'mascot';

type ImageUploadPurpose = 'avatar' | 'post' | 'gallery';
type SignedUploadContextType =
  | UploadVideoType
  | 'thumbnail_video'
  | 'thumbnail_course'
  | 'avt'
  | 'report'
  | 'role_upgrade';

const SIGNED_UPLOAD_CONTEXT_TYPES = new Set<SignedUploadContextType>([
  'highlight',
  'mascot',
  'thumbnail_video',
  'thumbnail_course',
  'avt',
  'report',
  'role_upgrade',
]);

/** Optional `job_id` is forwarded in signed context so the webhook can upsert by job. */
function buildSignedUploadContext(userId: number, body: { job_id?: unknown; type?: unknown }): string {
  const parts = [`userId=${userId}`];
  if (typeof body?.job_id === 'string' && body.job_id.trim().length > 0) {
    parts.push(`job_id=${body.job_id.trim()}`);
  }
  console.log('type: ', body.type);
  if (typeof body?.type === 'string') {
    const type = body.type.trim().toLowerCase() as SignedUploadContextType;
    console.log('check2: ', type);
    if (SIGNED_UPLOAD_CONTEXT_TYPES.has(type)) {
      parts.push(`type=${type}`);
    }
  }
  console.log('check3: ', parts);
  return parts.join('|');
}

/**
 * Folder layout for user-scoped images (override with `folder` / `folderName` on the body).
 * - avatar → avatars/{userId}
 * - post → posts/{userId}
 * - gallery → gallery/{userId}
 * - default → gallery/{userId}
 */
function resolveImageUploadFolder(
  userId: number,
  body: { folder?: unknown; folderName?: unknown; purpose?: unknown },
): string {
  const explicit =
    (typeof body.folder === 'string' && body.folder.trim()) ||
    (typeof body.folderName === 'string' && body.folderName.trim()) ||
    '';
  if (explicit) return explicit;

  const purpose =
    typeof body.purpose === 'string' ? body.purpose.trim().toLowerCase() : '';
  switch (purpose as ImageUploadPurpose | '') {
    case 'avatar':
      return `avatars/${userId}`;
    case 'post':
      return `posts/${userId}`;
    case 'gallery':
      return `gallery/${userId}`;
    default:
      return `gallery/${userId}`;
  }
}

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) { }

  private parseUserIdHeader(userIdHeader?: string): number {
    const userId =
      typeof userIdHeader === 'string' && userIdHeader.trim().length > 0
        ? Number(userIdHeader)
        : NaN;
    if (!userId || Number.isNaN(userId)) {
      throw new BadRequestException('Missing user_id');
    }
    return userId;
  }

  private signDirectUpload(folder: string, context: string) {
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = process.env.API_SECRET;
    const cloudName = process.env.CLOUD_NAME;
    const apiKey = process.env.API_KEY;

    if (!apiSecret || !cloudName || !apiKey) {
      throw new BadRequestException(
        'Missing Cloudinary env vars: API_SECRET, CLOUD_NAME, API_KEY',
      );
    }

    const paramsToSign = { timestamp, folder, context };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      cloud_name: cloudName,
      api_key: apiKey,
      folder,
      context,
    };
  }

  // Ký chữ ký cho frontend upload trực tiếp lên Cloudinary (Client-side signed upload)
  @Post('sign')
  @HttpCode(200)
  getSignature(@Body() body: any, @Headers('x-user-id') userIdHeader?: string) {
    const userId = this.parseUserIdHeader(userIdHeader);

    const folder =
      typeof body?.folder === 'string'
        ? body.folder
        : typeof body?.folderName === 'string'
          ? body.folderName
          : 'videos';

    const context = buildSignedUploadContext(userId, body);
    return this.signDirectUpload(folder, context);
  }

  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async upload(
    @UploadedFile() file: MulterFile,
    @Body() body: any,
    @Headers('x-user-id') xUserId?: string,
  ) {
    if (!file) throw new BadRequestException('Missing file field "video"');

    const rawType: unknown = body?.type;
    const type: UploadVideoType =
      rawType === 'mascot' || rawType === 'highlight' ? rawType : 'highlight';

    const folderName: string | undefined = typeof body?.folderName === 'string' ? body.folderName : undefined;

    const rawUserId =
      xUserId ??
      body?.user_id ??
      body?.userId;

    const userId =
      typeof rawUserId === 'string'
        ? Number(rawUserId)
        : typeof rawUserId === 'number'
          ? rawUserId
          : undefined;

    if (!userId || Number.isNaN(userId)) {
      throw new BadRequestException('Missing/invalid user id (use header x-user-id or body.user_id)');
    }

    const tmpDir = path.join(os.tmpdir(), 'media_service_cloudinary');
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const ext = path.extname(file.originalname) || '.mp4';
    const tempPath = path.join(tmpDir, `${Date.now()}-${file.originalname}${ext}`);

    await fs.promises.writeFile(tempPath, file.buffer);

    try {
      const secureUrl = await this.cloudinaryService.uploadToCloudinary(
        tempPath,
        folderName,
        userId,
        type,
      );

      return { success: true, secure_url: secureUrl };
    } finally {
      // Cleanup temp file even if upload fails
      fs.promises.unlink(tempPath).catch(() => { });
    }
  }
}

