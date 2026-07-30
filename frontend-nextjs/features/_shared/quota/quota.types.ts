export type QuotaFeature = "highlight" | "transcribe" | "quiz" | "mascot";

export interface FeatureCost {
  credits: number;
  /** true = `credits` tính cho mỗi phút video; false = giá cố định mỗi lần gọi. */
  perMinute: boolean;
}

export interface QuotaPricing {
  costs: Record<QuotaFeature, FeatureCost>;
  /** Trần thời lượng dùng để tính giá, tính bằng giây. */
  maxDurationSec: number;
}

export interface QuotaSnapshot {
  limit: number;
  used: number;
  remaining: number;
  /** ISO có offset, ví dụ "2026-07-29T00:00:00+07:00". */
  resetAt: string;
  pricing: QuotaPricing;
}
