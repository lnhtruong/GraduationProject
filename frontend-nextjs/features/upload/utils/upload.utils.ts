import { authStorageHelper } from "@/store/auth";
import type { SegmentRangePayload } from "../types";

// Fixed target used only when keep/remove segment marks are present — see
// specs/002-highlight-segment-picker-ui/research.md ("target_min/target_max:
// no new form field, fixed constants instead") in the colab2 repo.
const SEGMENT_SELECTION_TARGET_MIN = 150;
const SEGMENT_SELECTION_TARGET_MAX = 180;

export type HighlightReelLinkPayload = {
  video_url: string;
  video_id?: number;
  user_id: string;
  source_original_filename?: string;
  topic?: string;
  include_keywords?: string;
  exclude_keywords?: string;
  isOpenAI: string;
  isMultiOutput: string;
  duration_sec?: string;
  keep_ranges?: SegmentRangePayload[];
  remove_ranges?: SegmentRangePayload[];
  target_min?: number;
  target_max?: number;
};

export function buildHighlightReelLinkPayload(params: {
  videoUrl: string;
  videoId?: number | null;
  userId?: number | string | null;
  sourceOriginalFilename?: string;
  topic?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
  isMultiOutput?: boolean;
  isOpenAI?: boolean;
  durationSec?: number | null;
  keepRanges?: SegmentRangePayload[];
  removeRanges?: SegmentRangePayload[];
}): HighlightReelLinkPayload {
  const videoUrl = params.videoUrl.trim();
  let userIdVal = params.userId;
  if (userIdVal === undefined || userIdVal === null) {
    const stored = authStorageHelper.getUser() as { id?: number; user_id?: number } | null;
    userIdVal = stored?.id ?? stored?.user_id ?? null;
  }

  return {
    video_url: videoUrl,
    ...(params.videoId ? { video_id: params.videoId } : {}),
    user_id: userIdVal != null ? String(userIdVal) : "",
    ...(params.sourceOriginalFilename
      ? { source_original_filename: params.sourceOriginalFilename }
      : {}),
    ...(params.topic ? { topic: params.topic } : {}),
    ...(params.includeKeywords
      ? { include_keywords: params.includeKeywords }
      : {}),
    ...(params.excludeKeywords
      ? { exclude_keywords: params.excludeKeywords }
      : {}),
    isOpenAI: String(params.isOpenAI ?? false),
    isMultiOutput: String(params.isMultiOutput ?? false),
    // Thời lượng để backend tính credit quota. Thiếu → backend tính hệ số ×1.
    ...(params.durationSec && params.durationSec > 0
      ? { duration_sec: String(Math.round(params.durationSec)) }
      : {}),
    ...(params.keepRanges?.length || params.removeRanges?.length
      ? {
          keep_ranges: params.keepRanges ?? [],
          remove_ranges: params.removeRanges ?? [],
          target_min: SEGMENT_SELECTION_TARGET_MIN,
          target_max: SEGMENT_SELECTION_TARGET_MAX,
        }
      : {}),
  };
}
