// ============================================================================
// UPLOAD FEATURE TYPES
// ============================================================================

export interface JobIdResponse {
  job_id: string;
  status: string;
}

export type UploadStatus =
  "idle" | "uploading" | "pending" | "processing" | "completed" | "failed";

export type HighlightSource = "file" | "existing-video";

export interface Clip {
  name: string;
  url: string;
  videoId?: number;
  topicId?: number | string | null;
  description?: string | null;
  srtUrl?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
}

export interface UploadState {
  file: File | null;
  source: HighlightSource | null;
  progress: number | null;
  status: UploadStatus;
  jobId: string | null;
  bunnyVideoId: string | null;
  sourceVideoId: number | null;
  sourceVideoUrl: string | null;
  createdProjectId: number | null;
  clips: Clip[];
  isDownloading: boolean;
  error: string | null;
  stage?: string;
  progressPercent?: number;
  jobType?: string;
}

export interface HighlightParams {
  topic: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  isMultiOutput?: boolean;
  isOpenAI?: boolean;
  keepRanges?: SegmentRangePayload[];
  removeRanges?: SegmentRangePayload[];
}

// ============================================================================
// SEGMENT SELECTION PICKER (keep/remove subtitle segments)
// ============================================================================

/** One entry from a video's SRT, identified by its 1-based block index. */
export interface SubtitleLine {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

export type SegmentMarkState = "keep" | "remove";

/** index -> mark. Absent key == neutral (unmarked). */
export type SegmentSelectionState = Map<number, SegmentMarkState>;

/** Wire shape sent to /highlight-reel-link as keep_ranges/remove_ranges. */
export interface SegmentRangePayload {
  start_index: number;
  end_index: number;
}

export interface UploadHookReturn extends UploadState {
  setFile: (file: File | null) => void;
  /** Upload-only phase (ADR 0002) — kicks off as soon as the file is confirmed. */
  startFileUpload: (file: File) => Promise<void>;
  startUpload: (
    file: File,
    params: HighlightParams,
    durationSec?: number,
  ) => Promise<void>;
  startFromExistingVideo: (
    videoUrl: string,
    params: HighlightParams,
    durationSec?: number,
    videoId?: number | null,
  ) => Promise<void>;
  ensureProjectForClip: (clip: Clip) => Promise<{
    projectId: number;
    videoId?: number;
  } | null>;
  cancel: () => void;
  reset: () => void;
}

export interface HighlightReelLinkParams {
  videoUrl: string;
  videoId?: number | null;
  userId?: number | string | null;
  sourceOriginalFilename?: string;
  topic?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
  isMultiOutput?: boolean;
  isOpenAI?: boolean;
  /** Thời lượng video nguồn, giây. Dùng để backend tính credit quota. */
  durationSec?: number | null;
  keepRanges?: SegmentRangePayload[];
  removeRanges?: SegmentRangePayload[];
}
