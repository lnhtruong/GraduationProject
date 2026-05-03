"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createMediaUploadSocket } from "@/features/upload/api/upload.websocket";
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
  const socketRef = useRef<any | null>(null);

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

  // Real-time websocket for media events (upload/video completed, progress, error)
  useEffect(() => {
    const userId = user?.id;
    const hasTrackedVideo = !!session.videoId || !!getPendingSession?.();
    if (!userId || !hasTrackedVideo) return;

    try {
      const socket = createMediaUploadSocket(userId);
      socketRef.current = socket;

      const onVideoProgress = (data: any) => {
        try {
          const vid = data?.videoId ?? data?.data?.id ?? null;
          const progress = data?.progress ?? data?.data?.progress ?? null;
          if (!vid) return;
          if (String(vid) !== String(session.videoId)) return;
          patchSession({
            status: "processing",
            progressPercent: progress ?? 100,
          });
        } catch {}
      };

      const onVideoCompleted = (payload: any) => {
        try {
          const videoId =
            payload?.data?.id ?? payload?.data?.videoId ?? payload?.id;
          if (!videoId) return;
          if (String(videoId) !== String(session.videoId)) return;
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
        } catch {}
      };

      const onVideoError = (payload: any) => {
        try {
          const err = payload?.error ?? payload;
          patchSession({
            status: "failed",
            error: err?.message ?? "Lỗi xử lý video",
          });
          try {
            localStorage.removeItem("lessonUploadSession");
          } catch {}
        } catch {}
      };

      socket.on("video:progress", onVideoProgress);
      socket.on("video:completed", onVideoCompleted);
      socket.on("upload-video :completed", onVideoCompleted);
      socket.on("video:error", onVideoError);

      return () => {
        try {
          socket.off("video:progress", onVideoProgress);
          socket.off("video:completed", onVideoCompleted);
          socket.off("upload-video :completed", onVideoCompleted);
          socket.off("video:error", onVideoError);
          socket.disconnect();
        } catch {}
      };
    } catch {
      // ignore socket errors silently
    }
  }, [user?.id, session.videoId, getPendingSession]);

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
