import * as tus from "tus-js-client";
import { videoApi } from "../api/video.api";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import {
  BUNNY_MAX_UPLOAD_BYTES,
  BUNNY_MAX_UPLOAD_LABEL,
} from "@/lib/env";

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
    initialVideoUrl?: string | null;
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
  onCompleted?: (payload: {
    videoId: number;
    bunnyVideoId: string;
    readyVideoUrl?: string | null;
  }) => void;
  onError?: (message: string) => void;
};

class LessonVideoUploadManager {
  private upload: tus.Upload | null = null;

  private processingPollTimer: ReturnType<typeof setTimeout> | null = null;

  private activeVideoId: number | null = null;

  private activeBunnyVideoId: string | null = null;

  private activeInitialVideoUrl: string | null = null;

  private isSseConnected = false;

  private lastSseActivityAt = 0;

  private readonly fallbackPollIntervalMs = 120000;

  notifySSEConnection(connected: boolean) {
    this.isSseConnected = connected;
    this.lastSseActivityAt = connected ? Date.now() : 0;
  }

  notifySSEActivity() {
    this.isSseConnected = true;
    this.lastSseActivityAt = Date.now();
  }

  isUploading() {
    return this.upload !== null;
  }

  completeFromRealtime(videoId: number | string): void {
    if (this.activeVideoId && String(this.activeVideoId) !== String(videoId)) {
      return;
    }

    this.cleanupAll();
  }

  async startUpload(
    payload: StartUploadPayload,
    handlers: UploadLifecycleHandlers,
  ): Promise<void> {
    if (this.upload) {
      throw new Error("Đang có một video khác được upload.");
    }
    if (this.processingPollTimer || this.activeVideoId || this.activeBunnyVideoId) {
      this.cleanupAll();
    }

    if (payload.file.size > BUNNY_MAX_UPLOAD_BYTES) {
      throw new Error(
        `File quá lớn. Kích thước tối đa: ${BUNNY_MAX_UPLOAD_LABEL}`,
      );
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
    this.activeInitialVideoUrl = initResponse.url ?? initResponse.originalUrl ?? null;

    handlers.onSessionInit?.({
      videoId: initResponse.videoId,
      bunnyVideoId: initResponse.bunnyVideoId,
      // Backend returns an immediate Bunny `/original` URL so the lesson can
      // have a usable video row before transcoding finishes. The local blob
      // preview remains the primary preview during upload; SSE/polling swaps
      // the row to the processed playback URL later.
      initialVideoUrl: this.activeInitialVideoUrl,
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
        this.scheduleProcessingPoll(
          handlers,
          this.isSseConnected ? this.fallbackPollIntervalMs : 0,
        );
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
    this.activeInitialVideoUrl = null;
    this.isSseConnected = false;
    this.lastSseActivityAt = 0;
  }

  private isSseFresh() {
    return (
      this.isSseConnected &&
      Date.now() - this.lastSseActivityAt < this.fallbackPollIntervalMs
    );
  }

  private scheduleProcessingPoll(
    handlers: UploadLifecycleHandlers,
    delayMs = this.fallbackPollIntervalMs,
    startedAt = Date.now(),
  ) {
    if (this.processingPollTimer) {
      clearTimeout(this.processingPollTimer);
    }

    this.processingPollTimer = setTimeout(() => {
      this.processingPollTimer = null;
      void this.waitUntilReady(handlers, startedAt);
    }, delayMs);
  }

  private async waitUntilReady(
    handlers: UploadLifecycleHandlers,
    startedAt = Date.now(),
  ) {
    const bunnyVideoId = this.activeBunnyVideoId;
    const videoId = this.activeVideoId;
    const initialVideoUrl = this.activeInitialVideoUrl;

    if (!bunnyVideoId || !videoId) {
      handlers.onError?.("Thiếu thông tin video để theo dõi trạng thái xử lý.");
      this.cleanupAll();
      return;
    }

    const maxWaitMs = 20 * 60 * 1000;

    const poll = async () => {
      try {
        if (this.isSseFresh()) {
          this.scheduleProcessingPoll(
            handlers,
            this.fallbackPollIntervalMs,
            startedAt,
          );
          return;
        }

        const statusResponse = await videoApi.getBunnyVideoStatus(bunnyVideoId);
        const status =
          typeof statusResponse.status === "number"
            ? statusResponse.status
            : typeof statusResponse.Status === "number"
              ? statusResponse.Status
              : null;

        if (status === 3 || status === 4) {
          const video = await videoApi.findById(videoId);
          const readyVideoUrl = video?.url?.trim() || null;
          const isOriginalUrl = readyVideoUrl
            ? /\/original(?:[?#].*)?$/i.test(readyVideoUrl)
            : false;
          const isStillInitialOriginalUrl =
            Boolean(readyVideoUrl) &&
            (readyVideoUrl === initialVideoUrl || isOriginalUrl);
          const hasReadyUrl = Boolean(readyVideoUrl && !isStillInitialOriginalUrl);

          if (hasReadyUrl) {
            handlers.onCompleted?.({ videoId, bunnyVideoId, readyVideoUrl });
            this.cleanupAll();
            return;
          }
        }

        if (Date.now() - startedAt > maxWaitMs) {
          handlers.onError?.("Video xử lý quá lâu. Vui lòng kiểm tra lại sau.");
          this.cleanupAll();
          return;
        }

        this.scheduleProcessingPoll(
          handlers,
          this.fallbackPollIntervalMs,
          startedAt,
        );
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
