/**
 * Trừ/hoàn credit AI cho job mà course_service tự submit thẳng sang Colab.
 *
 * Bảng giá và counter theo ngày đều nằm trong inference_service — nhân bản sang
 * đây sẽ tạo hai nguồn sự thật và chắc chắn lệch nhau. Nên helper này chỉ gọi
 * endpoint nội bộ của inference_service, còn job vẫn đi thẳng Colab.
 *
 * Fail-open: inference_service chết thì log rồi cho job chạy tiếp. Quota là lớp
 * chống lạm dụng, không phải lớp bảo mật — chặn tính năng vì nó là tệ hơn.
 */
import { HttpException, Logger } from '@nestjs/common';

const logger = new Logger('AiQuotaHelper');

export type AiQuotaFeature = 'highlight' | 'transcribe' | 'quiz' | 'mascot';

export interface AiQuotaRequester {
  userId: number;
  role: number;
}

function baseUrl(): string | null {
  const url = process.env.INFERENCE_SERVICE_BASE_URL?.trim().replace(
    /\/+$/,
    '',
  );
  return url || null;
}

function headers(): Record<string, string> {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  return {
    'Content-Type': 'application/json',
    ...(secret ? { 'x-internal-secret': secret } : {}),
  };
}

async function post(path: string, body: unknown, timeoutMs = 5000) {
  const url = baseUrl();
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      // 429 (hết hạn mức) phải tới được FE nguyên trạng, không bọc lại.
      throw new HttpException(data, response.status);
    }
    return data as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Trừ credit trước khi submit. Trả về số credit đã trừ (0 = không trừ gì, gọi
 * `refundAiQuota` với 0 là no-op). Ném 429 nguyên trạng khi vượt hạn mức.
 */
export async function reserveAiQuota(
  feature: AiQuotaFeature,
  durationSec: number | undefined,
  requester: AiQuotaRequester,
): Promise<number> {
  try {
    const data = await post('/quota/reserve', {
      userId: requester.userId,
      role: requester.role,
      feature,
      durationSec,
    });
    const cost = Number(data?.cost ?? 0);
    return Number.isFinite(cost) && cost > 0 ? cost : 0;
  } catch (error) {
    if (error instanceof HttpException) throw error;
    logger.warn(
      `Bỏ qua trừ quota (inference_service không phản hồi): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return 0;
  }
}

/**
 * Đăng ký job vừa submit để inference_service hoàn credit khi job chết trên
 * Colab. Bỏ bước này thì job fail = mất credit, vì Colab không báo về đây.
 */
export async function rememberAiQuotaJob(
  jobId: string,
  userId: number,
  cost: number,
): Promise<void> {
  if (cost <= 0) return;
  try {
    await post('/quota/job', { jobId, userId, cost });
  } catch (error) {
    logger.warn(
      `Không đăng ký được job để hoàn quota (jobId=${jobId}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/** Hoàn credit khi submit sang Colab thất bại. Best-effort. */
export async function refundAiQuota(
  userId: number,
  cost: number,
): Promise<void> {
  if (cost <= 0) return;
  try {
    await post('/quota/refund', { userId, cost });
  } catch (error) {
    logger.warn(
      `Hoàn quota thất bại (userId=${userId}, cost=${cost}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
