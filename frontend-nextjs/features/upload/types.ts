// ============================================================================
// UPLOAD FEATURE TYPES
// ============================================================================

export interface JobIdResponse {
  job_id: string;
  status: string;
}

/**
 * Upload status states
 * - idle: Chưa bắt đầu upload
 * - uploading: Đang tải file lên server
 * - pending: Đã tải lên, đang chờ xử lý
 * - processing: Đang xử lý video
 * - completed: Hoàn thành
 * - failed: Thất bại
 */
export type UploadStatus =
  | "idle"
  | "uploading"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/**
 * Clip data structure
 */
export interface Clip {
  name: string;
  url: string;
  videoId?: number;
}

/**
 * Upload state interface
 */
export interface UploadState {
  file: File | null;
  progress: number | null;
  status: UploadStatus;
  jobId: string | null;
  createdProjectId: number | null;
  clips: Clip[];
  isDownloading: boolean;
  error: string | null;
  stage?: string; // Stage message from backend
  progressPercent?: number; // Progress percentage from backend (0-100)
}

/**
 * Highlight parameters for form
 */
export interface HighlightParams {
  topic: string;
  includeKeywords: string[];
  excludeKeywords: string[];
}

/**
 * Upload hook return type
 */
export interface UploadHookReturn extends UploadState {
  setFile: (file: File | null) => void;
  startUpload: (file: File, params: HighlightParams) => Promise<void>;
  ensureProjectForClip: (clip: Clip) => Promise<{
    projectId: number;
    videoId: number;
  } | null>;
  cancel: () => void;
  reset: () => void;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface HighlightReelParams {
  file: File;
  topic?: string;
  includeKeywords?: string;
  excludeKeywords?: string;
  /** Called with 0–100 as file bytes are sent to the server */
  onUploadProgress?: (percent: number) => void;
}
