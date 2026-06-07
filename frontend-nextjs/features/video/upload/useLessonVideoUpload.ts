"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createMediaUploadStream } from "@/features/_shared/realtime/media-upload-stream";
import { lessonVideoUploadManager } from "./lesson-video-upload.manager";

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
  error: string | null;
  startedAt: number | null;
  updatedAt: number | null;
}

type StartUploadArgs = {
  file: File;
  title?: string;
  onCompleted?: (videoId: number) => void;
};

type LastUploadArgs = StartUploadArgs | null;

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
  error: null,
  startedAt: null,
  updatedAt: null,
};

export function useLessonVideoUpload() {
  const [session, setSession] =
    useState<LessonVideoUploadSession>(INITIAL_SESSION);
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
    async ({ file, title, onCompleted }: StartUploadArgs) => {
      if (session.status === "uploading" || session.status === "initializing") {
        throw new Error(
          "Đang có upload dở dang. Vui lòng chờ hoàn tất hoặc hủy.",
        );
      }

      lastUploadArgsRef.current = { file, title, onCompleted };

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
        { file, title },
        {
          onSessionInit: ({ videoId, bunnyVideoId, fileName, fileSize }) => {
            patchSession({
              status: "uploading",
              videoId,
              bunnyVideoId,
              fileName,
              fileSize,
              error: null,
            });

            // persist minimal upload session metadata so user can resume after reload
            try {
              const pending = {
                videoId,
                bunnyVideoId,
                fileName,
                fileSize,
                startedAt: Date.now(),
              } as const;
              localStorage.setItem(
                "lessonUploadSession",
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
          onCompleted: ({ videoId }) => {
            patchSession({
              status: "completed",
              progressPercent: 100,
              error: null,
            });
            lastUploadArgsRef.current = null;
            // clear persisted session on completion
            try {
              localStorage.removeItem("lessonUploadSession");
            } catch {}
            onCompleted?.(videoId);
          },
          onError: (message) => {
            patchSession({
              status: "failed",
              error: message,
            });
            try {
              localStorage.removeItem("lessonUploadSession");
            } catch {}
          },
        },
      );
    },
    [session.status, patchSession],
  );

  const cancelUpload = useCallback(async () => {
    await lessonVideoUploadManager.cancelCurrentUpload();
    lastUploadArgsRef.current = null;
    patchSession({
      status: "canceled",
      error: null,
    });
    try {
      localStorage.removeItem("lessonUploadSession");
    } catch {}
  }, [patchSession]);

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
      localStorage.removeItem("lessonUploadSession");
    } catch {}
  }, []);

  const getPendingSession = useCallback(() => {
    try {
      const raw = localStorage.getItem("lessonUploadSession");
      if (!raw) return null;
      return JSON.parse(raw) as {
        videoId: number;
        bunnyVideoId: string;
        fileName: string;
        fileSize?: number;
        startedAt?: number;
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const shouldWarn =
      session.status === "initializing" || session.status === "uploading";

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

  // Real-time SSE for media events (upload/video completed, progress, error)
  useEffect(() => {
    const userId = user?.id;
    const hasTrackedVideo = !!session.videoId || !!getPendingSession?.();
    if (!userId || !hasTrackedVideo) return;

    const stream = createMediaUploadStream(
      {
        onProgress: (data) => {
          try {
            // Support both old format (videoId) and new format (jobId/stage)
            const vid = data?.videoId ?? null;
            if (vid && String(vid) === String(session.videoId)) {
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
            const videoId = payload?.data?.videoId;
            const jobId = payload?.data?.job_id ?? payload?.data?.jobId;

            // Match by videoId (primary) or jobId (fallback for AI processing)
            if (videoId && String(videoId) === String(session.videoId)) {
              patchSession({
                status: "completed",
                progressPercent: 100,
                error: null,
              });
              // call completion callback if provided
              try {
                lastUploadArgsRef.current?.onCompleted?.(Number(videoId));
              } catch {}
              try {
                localStorage.removeItem("lessonUploadSession");
              } catch {}
            }
          } catch {}
        },

        onError: (payload) => {
          try {
            patchSession({
              status: "failed",
              error: payload.error?.message ?? "Lỗi xử lý video",
            });
            try {
              localStorage.removeItem("lessonUploadSession");
            } catch {}
          } catch {}
        },

        onConnectionError: (error) => {
          console.error("[useLessonVideoUpload] SSE connection error:", error);
        },
      },
      { userId },
    );

    return () => {
      stream.close();
    };
  }, [user?.id, session.videoId, getPendingSession, patchSession]);

  return {
    session,
    startUpload,
    retryUpload,
    cancelUpload,
    clearSession,
    isUploading:
      session.status === "initializing" || session.status === "uploading",
    getPendingSession,
  };
}
