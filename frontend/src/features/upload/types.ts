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
}

/**
 * Upload hook return type
 */
export interface UploadHookReturn extends UploadState {
  setFile: (file: File | null) => void;
  startUpload: (file: File) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}