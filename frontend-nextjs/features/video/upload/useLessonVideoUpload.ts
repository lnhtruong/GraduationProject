"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createMediaUploadStream } from "@/features/_shared/realtime/media-upload-stream";
import { lessonVideoUploadManager } from "./lesson-video-upload.manager";
import { videoApi } from "../api/video.api";

type LessonVideoUploadStatus =
  | "idle"
  | "initializing"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";

export interface LessonVideoUploadSession {
  status: LessonVideoUploadStatus;
  fileName: string | null;
  fileSize: number | null;
  progressPercent: number;
  bytesUploaded: number;
  bytesTotal: number;
  videoId: number | null;
  bunnyVideoId: string | null;
  uploadUrl: string | null;
  initialVideoUrl: string | null;
  readyVideoUrl: string | null;
  error: string | null;
  startedAt: number | null;
  updatedAt: number | null;
}

type StartUploadArgs = {
  file: File;
  title?: string;
  courseId?: number | null;
  lessonId?: number | null;
  onCompleted?: (videoId: number) => void;
};

type LastUploadArgs = StartUploadArgs | null;

type UseLessonVideoUploadOptions = {
  storageKey?: string;
};

const DEFAULT_UPLOAD_SESSION_STORAGE_KEY = "lessonUploadSession";

const INITIAL_SESSION: LessonVideoUploadSession = {
  status: "idle",
  fileName: null,
  fileSize: null,
  progressPercent: 0,
  bytesUploaded: 0,
  bytesTotal: 0,
  videoId: null,
  bunnyVideoId: null,
  uploadUrl: null,
  initialVideoUrl: null,
  readyVideoUrl: null,
  error: null,
  startedAt: null,
  updatedAt: null,
};

function readPendingLessonUploadSession(
  storageKey = DEFAULT_UPLOAD_SESSION_STORAGE_KEY,
): LessonVideoUploadSession {
  if (typeof window === "undefined") return INITIAL_SESSION;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return INITIAL_SESSION;

    const pending = JSON.parse(raw) as {
      videoId?: number;
      bunnyVideoId?: string | null;
      initialVideoUrl?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
      startedAt?: number | null;
    };

    if (!pending.videoId) {
      window.localStorage.removeItem(storageKey);
      return INITIAL_SESSION;
    }

    return {
      ...INITIAL_SESSION,
      status: "processing",
      fileName: pending.fileName ?? "Video đang xử lý",
      fileSize: pending.fileSize ?? null,
      progressPercent: 100,
      bytesUploaded: pending.fileSize ?? 0,
      bytesTotal: pending.fileSize ?? 0,
      videoId: pending.videoId,
      bunnyVideoId: pending.bunnyVideoId ?? null,
      initialVideoUrl: pending.initialVideoUrl ?? null,
      startedAt: pending.startedAt ?? Date.now(),
      updatedAt: Date.now(),
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return INITIAL_SESSION;
  }
}

function isReadyPlaybackUrl(
  readyVideoUrl: string | null,
  initialVideoUrl: string | null,
) {
  if (!readyVideoUrl) return false;
  const isOriginalUrl = /\/original(?:[?#].*)?$/i.test(readyVideoUrl);
  return readyVideoUrl !== initialVideoUrl && !isOriginalUrl;
}

export function useLessonVideoUpload({
  storageKey = DEFAULT_UPLOAD_SESSION_STORAGE_KEY,
}: UseLessonVideoUploadOptions = {}) {
  const [session, setSession] = useState<LessonVideoUploadSession>(() =>
    readPendingLessonUploadSession(storageKey),
  );
  const lastUploadArgsRef = useRef<LastUploadArgs>(null);
  const { user } = useAuth();

  const patchSession = useCallback(
    (patch: Partial<LessonVideoUploadSession>) => {
      setSession((current) => ({
        ...current,
        ...patch,
        updatedAt: Date.now(),
      }));
    },
    [],
  );

  const startUpload = useCallback(
    async ({ file, title, courseId, lessonId, onCompleted }: StartUploadArgs) => {
      if (
        session.status === "uploading" ||
        session.status === "initializing"
      ) {
        throw new Error(
          "Đang có upload dở dang. Vui lòng chờ hoàn tất hoặc hủy.",
        );
      }

      if (session.status === "processing") {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }

      lastUploadArgsRef.current = { file, title, courseId, lessonId, onCompleted };

      setSession({
        ...INITIAL_SESSION,
        status: "initializing",
        fileName: file.name,
        fileSize: file.size,
        progressPercent: 0,
        bytesUploaded: 0,
        bytesTotal: file.size,
        error: null,
        startedAt: Date.now(),
      });

      await lessonVideoUploadManager.startUpload(
        { file, title, courseId, lessonId },
        {
          onSessionInit: ({
            videoId,
            bunnyVideoId,
            initialVideoUrl,
            fileName,
            fileSize,
          }) => {
            patchSession({
              status: "uploading",
              videoId,
              bunnyVideoId,
              initialVideoUrl: initialVideoUrl ?? null,
              fileName,
              fileSize,
              error: null,
            });

            // persist minimal upload session metadata so user can resume after reload
            try {
              const pending = {
                videoId,
                bunnyVideoId,
                initialVideoUrl: initialVideoUrl ?? null,
                fileName,
                fileSize,
                startedAt: Date.now(),
              } as const;
              localStorage.setItem(
                storageKey,
                JSON.stringify(pending),
              );
            } catch {}
          },
          onUploadProgress: ({
            bytesUploaded,
            bytesTotal,
            progressPercent,
          }) => {
            patchSession({
              status: "uploading",
              bytesUploaded,
              bytesTotal,
              progressPercent,
            });
          },
          onUploadUrl: (uploadUrl) => {
            patchSession({ uploadUrl });
          },
          onProcessing: () => {
            patchSession({
              status: "processing",
              progressPercent: 100,
            });
          },
          onCompleted: ({ videoId, readyVideoUrl }) => {
            patchSession({
              status: "completed",
              progressPercent: 100,
              readyVideoUrl: readyVideoUrl ?? null,
              error: null,
            });
            lastUploadArgsRef.current = null;
            // clear persisted session on completion
            try {
              localStorage.removeItem(storageKey);
            } catch {}
            onCompleted?.(videoId);
          },
          onError: (message) => {
            patchSession({
              status: "failed",
              error: message,
            });
            try {
              localStorage.removeItem(storageKey);
            } catch {}
          },
        },
      );
    },
    [session.status, patchSession, storageKey],
  );

  const cancelUpload = useCallback(async () => {
    await lessonVideoUploadManager.cancelCurrentUpload();
    lastUploadArgsRef.current = null;
    patchSession({
      status: "canceled",
      error: null,
    });
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [patchSession, storageKey]);

  const retryUpload = useCallback(async () => {
    const lastUploadArgs = lastUploadArgsRef.current;
    if (!lastUploadArgs) {
      throw new Error("Không có file để thử lại.");
    }

    await startUpload(lastUploadArgs);
  }, [startUpload]);

  const clearSession = useCallback(() => {
    void lessonVideoUploadManager.cancelCurrentUpload();
    setSession(INITIAL_SESSION);
    lastUploadArgsRef.current = null;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const getPendingSession = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as {
        videoId: number;
        bunnyVideoId: string;
        initialVideoUrl?: string | null;
        fileName: string;
        fileSize?: number;
        startedAt?: number;
      };
    } catch {
      return null;
    }
  }, [storageKey]);

  useEffect(() => {
    const shouldWarn =
      session.status === "initializing" ||
      session.status === "uploading" ||
      session.status === "processing";

    if (!shouldWarn) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const keyDown = (event: KeyboardEvent) => {
      const isReloadShortcut =
        event.key === "F5" ||
        (event.ctrlKey && event.key.toLowerCase() === "r");
      if (!isReloadShortcut) return;

      event.preventDefault();
      window.alert(
        "Đang upload video bài học. Vui lòng chờ upload hoàn tất trước khi tải lại trang.",
      );
    };

    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("keydown", keyDown);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("keydown", keyDown);
    };
  }, [session.status]);

  useEffect(() => {
    if (session.status !== "processing" || !session.videoId) return;

    let canceled = false;

    const checkVideoReadiness = async () => {
      try {
        const video = await videoApi.findById(Number(session.videoId));
        if (canceled) return;

        const readyVideoUrl = video?.url?.trim() || null;
        if (!isReadyPlaybackUrl(readyVideoUrl, session.initialVideoUrl)) {
          return;
        }

        patchSession({
          status: "completed",
          progressPercent: 100,
          readyVideoUrl,
          error: null,
        });
        lessonVideoUploadManager.completeFromRealtime(Number(session.videoId));
        try {
          lastUploadArgsRef.current?.onCompleted?.(Number(session.videoId));
        } catch {}
        lastUploadArgsRef.current = null;
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      } catch {
        // Keep the restored processing session alive; SSE may still complete it.
      }
    };

    const pollDelayMs = 120000;
    const timeout = window.setTimeout(checkVideoReadiness, pollDelayMs);
    const timer = window.setInterval(checkVideoReadiness, pollDelayMs);

    return () => {
      canceled = true;
      window.clearTimeout(timeout);
      window.clearInterval(timer);
    };
  }, [
    patchSession,
    session.initialVideoUrl,
    session.status,
    session.videoId,
    storageKey,
  ]);

  // Real-time SSE for media events (upload/video completed, progress, error)
  useEffect(() => {
    const userId = user?.id;
    const hasTrackedVideo = !!session.videoId || !!getPendingSession?.();
    if (!userId || !hasTrackedVideo) return;

    const stream = createMediaUploadStream(
      {
        onOpen: () => {
          lessonVideoUploadManager.notifySSEConnection(true);
        },
        onProgress: (data) => {
          try {
            // Support both old format (videoId) and new format (jobId/stage)
            const vid = data?.videoId ?? null;
            if (vid && String(vid) === String(session.videoId)) {
              lessonVideoUploadManager.notifySSEActivity();
              patchSession({
                status: "processing",
                progressPercent: data.progress ?? 100,
              });
            }
            // New format: Job stage updates (less critical for lesson videos)
          } catch {}
        },

        onCompleted: (payload) => {
          try {
            const flatPayload = payload as unknown as {
              videoId?: number;
              video_id?: number;
              job_id?: string;
              jobId?: string;
              url?: string;
              video_url?: string;
              data?: {
                videoId?: number;
                video_id?: number;
                job_id?: string;
                jobId?: string;
                url?: string;
                video_url?: string;
              };
            };
            const videoId =
              flatPayload.data?.videoId ??
              flatPayload.data?.video_id ??
              flatPayload.videoId ??
              flatPayload.video_id;
            const completedUrl =
              flatPayload.data?.url ??
              flatPayload.data?.video_url ??
              flatPayload.url ??
              flatPayload.video_url ??
              null;
            // Match by videoId from webhook/SSE. Polling remains the fallback.
            if (videoId && String(videoId) === String(session.videoId)) {
              lessonVideoUploadManager.notifySSEActivity();
              void (async () => {
                lessonVideoUploadManager.completeFromRealtime(Number(videoId));
                let readyVideoUrl = completedUrl;
                if (!readyVideoUrl) {
                  try {
                    const video = await videoApi.findById(Number(videoId));
                    readyVideoUrl = video?.url ?? null;
                  } catch {}
                }

                patchSession({
                  status: "completed",
                  progressPercent: 100,
                  readyVideoUrl,
                  error: null,
                });
                // call completion callback if provided
                try {
                  lastUploadArgsRef.current?.onCompleted?.(Number(videoId));
                } catch {}
                lastUploadArgsRef.current = null;
                try {
                  localStorage.removeItem(storageKey);
                } catch {}
              })();
            }
          } catch {}
        },

        onError: (payload) => {
          try {
            const payloadVideoId = payload.error?.id ?? payload.jobId ?? null;
            if (
              payloadVideoId &&
              session.videoId &&
              String(payloadVideoId) !== String(session.videoId)
            ) {
              return;
            }

            patchSession({
              status: "failed",
              error: payload.error?.message ?? "Lỗi xử lý video",
            });
            try {
              localStorage.removeItem(storageKey);
            } catch {}
          } catch {}
        },

        onConnectionError: (error) => {
          lessonVideoUploadManager.notifySSEConnection(false);
          console.error("[useLessonVideoUpload] SSE connection error:", error);
        },
      },
      { userId },
    );

    return () => {
      stream.close();
    };
  }, [user?.id, session.videoId, getPendingSession, patchSession, storageKey]);

  return {
    session,
    startUpload,
    retryUpload,
    cancelUpload,
    clearSession,
    isUploadBlocking:
      session.status === "initializing" ||
      session.status === "uploading",
    isUploading:
      session.status === "initializing" ||
      session.status === "uploading" ||
      session.status === "processing",
    getPendingSession,
  };
}
