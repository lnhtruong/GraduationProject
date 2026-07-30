import { authStorageHelper } from "@/store/auth";

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
  };
}
