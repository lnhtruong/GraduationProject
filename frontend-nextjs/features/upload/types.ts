// ============================================================================
// UPLOAD FEATURE TYPES
// ============================================================================

export interface JobIdResponse {
  job_id: string;
  status: string;
}

export type UploadStatus =
  | "idle"
  | "uploading"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

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
}

export interface HighlightParams {
  topic: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  isMultiOutput?: boolean;
  isOpenAI?: boolean;
}

export interface UploadHookReturn extends UploadState {
  setFile: (file: File | null) => void;
  startUpload: (file: File, params: HighlightParams) => Promise<void>;
  startFromExistingVideo: (videoUrl: string, params: HighlightParams) => Promise<void>;
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
}
