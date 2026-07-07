import * as tus from "tus-js-client";
import { videoApi } from "../api/video.api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

type StartUploadPayload = {
  file: File;
  title?: string;
  courseId?: number | null;
  lessonId?: number | null;
};

type UploadLifecycleHandlers = {
  onSessionInit?: (payload: {
    videoId: number;
    bunnyVideoId: string;
    fileName: string;
    fileSize: number;
  }) => void;
  onUploadProgress?: (payload: {
    bytesUploaded: number;
    bytesTotal: number;
    progressPercent: number;
  }) => void;
  onUploadUrl?: (uploadUrl: string | null) => void;
  onProcessing?: () => void;
  onCompleted?: (payload: { videoId: number; bunnyVideoId: string }) => void;
  onError?: (message: string) => void;
};

class LessonVideoUploadManager {
  private upload: tus.Upload | null = null;

  private processingPollTimer: ReturnType<typeof setTimeout> | null = null;

  private activeVideoId: number | null = null;

  private activeBunnyVideoId: string | null = null;

  isUploading() {
    return this.upload !== null;
  }

  async startUpload(
    payload: StartUploadPayload,
    handlers: UploadLifecycleHandlers,
  ): Promise<void> {
    if (this.upload) {
      throw new Error("Đang có một video khác được upload.");
    }

    const initResponse = await videoApi.initBunnyUpload({
      title: payload.title ?? payload.file.name,
      meta: {
        purpose: "lesson_video",
        ...(payload.courseId ? { courseId: payload.courseId } : {}),
        ...(payload.lessonId ? { lessonId: payload.lessonId } : {}),
      },
    });

    this.activeVideoId = initResponse.videoId;
    this.activeBunnyVideoId = initResponse.bunnyVideoId;

    handlers.onSessionInit?.({
      videoId: initResponse.videoId,
      bunnyVideoId: initResponse.bunnyVideoId,
      fileName: payload.file.name,
      fileSize: payload.file.size,
    });

    const upload = new tus.Upload(payload.file, {
      endpoint: initResponse.tus.endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      chunkSize: 8 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      headers: {
        AuthorizationSignature: initResponse.tus.headers.AuthorizationSignature,
        AuthorizationExpire: initResponse.tus.headers.AuthorizationExpire,
        LibraryId: initResponse.tus.headers.LibraryId,
        VideoId: initResponse.tus.headers.VideoId,
      },
      metadata: {
        filetype: payload.file.type || "video/mp4",
        title: payload.title ?? payload.file.name,
      },
      onError: (error) => {
        this.cleanupAll();
        handlers.onError?.(
          getUserFacingErrorMessage(
            error,
            "Upload thất bại. Vui lòng thử lại.",
          ),
        );
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const progressPercent = Math.min(
          99,
          Math.round((bytesUploaded / Math.max(bytesTotal, 1)) * 100),
        );
        handlers.onUploadProgress?.({
          bytesUploaded,
          bytesTotal,
          progressPercent,
        });
      },
      onSuccess: () => {
        handlers.onUploadUrl?.(upload.url ?? null);
        handlers.onProcessing?.();
        this.cleanupUploadOnly();
        void this.waitUntilReady(handlers);
      },
    });

    this.upload = upload;

    const previousUploads = await upload.findPreviousUploads();
    if (previousUploads.length > 0) {
      upload.resumeFromPreviousUpload(previousUploads[0]);
      handlers.onUploadUrl?.(previousUploads[0].uploadUrl ?? null);
    }

    upload.start();
  }

  async cancelCurrentUpload(): Promise<void> {
    if (!this.upload) return;
    try {
      await this.upload.abort(false);
    } finally {
      this.cleanupAll();
    }
  }

  private cleanupUploadOnly() {
    this.upload = null;
  }

  private cleanupAll() {
    this.cleanupUploadOnly();
    if (this.processingPollTimer) {
      clearTimeout(this.processingPollTimer);
      this.processingPollTimer = null;
    }
    this.activeVideoId = null;
    this.activeBunnyVideoId = null;
  }

  private async waitUntilReady(handlers: UploadLifecycleHandlers) {
    const bunnyVideoId = this.activeBunnyVideoId;
    const videoId = this.activeVideoId;

    if (!bunnyVideoId || !videoId) {
      handlers.onError?.("Thiếu thông tin video để theo dõi trạng thái xử lý.");
      this.cleanupAll();
      return;
    }

    const startedAt = Date.now();
    const maxWaitMs = 20 * 60 * 1000;

    const poll = async () => {
      try {
        const statusResponse = await videoApi.getBunnyVideoStatus(bunnyVideoId);
        const status =
          typeof statusResponse.status === "number"
            ? statusResponse.status
            : typeof statusResponse.Status === "number"
              ? statusResponse.Status
              : null;

        if (status === 3 || status === 4) {
          handlers.onCompleted?.({ videoId, bunnyVideoId });
          this.cleanupAll();
          return;
        }

        if (Date.now() - startedAt > maxWaitMs) {
          handlers.onError?.("Video xử lý quá lâu. Vui lòng kiểm tra lại sau.");
          this.cleanupAll();
          return;
        }

        this.processingPollTimer = setTimeout(() => {
          void poll();
        }, 10000);
      } catch (error) {
        handlers.onError?.(
          getUserFacingErrorMessage(
            error,
            "Không thể kiểm tra trạng thái video. Vui lòng thử lại sau.",
          ),
        );
        this.cleanupAll();
      }
    };

    await poll();
  }
}

export const lessonVideoUploadManager = new LessonVideoUploadManager();
