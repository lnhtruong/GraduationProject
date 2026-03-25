// ============================================================================
// UPLOAD FEATURE TYPES
// ============================================================================

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
  cancel: () => void;
  reset: () => void;
}
