import { registerAs } from '@nestjs/config';

export type QuotaFeature = 'highlight' | 'transcribe' | 'quiz' | 'mascot';

export interface FeatureCost {
  credits: number;
  /** true = `credits` tính cho mỗi phút video; false = giá cố định mỗi lần gọi. */
  perMinute: boolean;
}

export interface QuotaConfig {
  enabled: boolean;
  /**
   * role number → credit mỗi cửa sổ 24h. Role: 1 = admin, 2 = student,
   * 3 = lecturer.
   */
  dailyLimits: Record<number, number>;
  /** Áp dụng khi request thiếu role hoặc role lạ (fail-safe = mức Student). */
  defaultLimit: number;
  costs: Record<QuotaFeature, FeatureCost>;
  maxDurationSec: number;
  /** Độ dài cửa sổ quota, tính từ lần trừ credit đầu tiên của người dùng. */
  windowSeconds: number;
  /** TTL của record hoàn credit theo job — phải dài hơn thời gian job chạy. */
  jobTtlSeconds: number;
}

export const ROLE_ADMIN = 1;
export const ROLE_STUDENT = 2;
export const ROLE_LECTURER = 3;

function intEnv(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default registerAs<QuotaConfig>('quota', () => {
  const student = intEnv('QUOTA_DAILY_STUDENT', 100);
  return {
    enabled: process.env.QUOTA_ENABLED !== 'false',
    dailyLimits: {
      [ROLE_ADMIN]: intEnv('QUOTA_DAILY_ADMIN', 500),
      [ROLE_STUDENT]: student,
      [ROLE_LECTURER]: intEnv('QUOTA_DAILY_LECTURER', 500),
    },
    defaultLimit: student,
    costs: {
      highlight: {
        credits: intEnv('QUOTA_COST_HIGHLIGHT', 1),
        perMinute: true,
      },
      transcribe: {
        credits: intEnv('QUOTA_COST_TRANSCRIBE', 1),
        perMinute: true,
      },
      quiz: { credits: intEnv('QUOTA_COST_QUIZ', 2), perMinute: true },
      mascot: { credits: intEnv('QUOTA_COST_MASCOT', 10), perMinute: true },
    },
    maxDurationSec: intEnv('QUOTA_MAX_DURATION_SEC', 14400),
    windowSeconds: intEnv('QUOTA_WINDOW_SECONDS', 86400),
    jobTtlSeconds: intEnv('QUOTA_JOB_TTL_SECONDS', 172800),
  };
});
