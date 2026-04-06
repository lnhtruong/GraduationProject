"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useProject,
  useCreateProject,
  useUpdateProject,
  useProjectLayers,
  useLayer,
  useCreateLayer,
  useUpdateLayer,
  useDeleteLayer,
  useUserHighlightVideos,
  useUserMascotImages,
} from "@/features/videoEditor/api/editSession.hooks";
import type { ExternalEditorPanelBindings } from "@/features/videoEditor/types";
import { normalizeMascotScale } from "@/features/videoEditor/utils/mascotPlacement";
import { toast } from "sonner";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const e = error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    };

    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(" | ");
    if (typeof msg === "string") return msg;
  }

  return "Unknown error";
}

export function useStudioSession() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [editId, setEditId] = useState<number | null>(null);
  const [sessionName, setSessionName] = useState("Untitled Project");
  const [isBootstrappingProject, setIsBootstrappingProject] = useState(false);
  const [selectedMascotImageId, setSelectedMascotImageId] = useState<
    number | null
  >(null);
  const bootstrappedSourceRef = useRef<string | null>(null);

  const rawEditId =
    searchParams.get("edit_id") ??
    searchParams.get("editId") ??
    searchParams.get("editid");
  const rawVideoId =
    searchParams.get("video_id") ?? searchParams.get("videoId");
  const queryEditId = rawEditId ? Number(rawEditId) : NaN;
  const queryVideoId = rawVideoId ? Number(rawVideoId) : NaN;

  const selectedVideoId =
    Number.isFinite(queryVideoId) && queryVideoId > 0
      ? queryVideoId
      : undefined;
  const activeEditId =
    editId ??
    (Number.isFinite(queryEditId) && queryEditId > 0 ? queryEditId : null);

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);

    if (activeEditId) {
      params.set("edit_id", String(activeEditId));
    } else {
      params.delete("edit_id");
    }

    params.delete("editId");
    params.delete("editid");
    params.delete("new");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [activeEditId, currentQuery, pathname, router]);

  const {
    data: highlightVideos = [],
    isLoading: highlightVideosLoading,
    refetch: refetchHighlightVideos,
  } = useUserHighlightVideos(user?.id || null);
  const { data: mascotImages = [], isLoading: mascotImagesLoading } =
    useUserMascotImages(user?.id || null);
  const { data: currentProject } = useProject(activeEditId);
  const { data: projectLayers = [] } = useProjectLayers(activeEditId);
  const firstOverlayId =
    projectLayers.length > 0 ? projectLayers[0].mascot_overlay_id : null;
  const { data: overlayDetail } = useLayer(firstOverlayId);
  const activeSessionName = currentProject?.session_name ?? sessionName;
  const existingMascotOverlay = overlayDetail ?? projectLayers[0] ?? null;
  const existingMascotOverlayId =
    existingMascotOverlay?.mascot_overlay_id ?? null;

  useEffect(() => {
    if (selectedMascotImageId || !existingMascotOverlay?.image_id) return;
    setSelectedMascotImageId(existingMascotOverlay.image_id);
  }, [existingMascotOverlay, selectedMascotImageId]);

  const getProjectIdFromResponse = (data: unknown): number | null => {
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;

    if (typeof record.edit_id === "number") return record.edit_id;
    if (typeof record.id === "number") return record.id;

    const nestedData = record.data;
    if (nestedData && typeof nestedData === "object") {
      const nested = nestedData as Record<string, unknown>;
      if (typeof nested.edit_id === "number") return nested.edit_id;
      if (typeof nested.id === "number") return nested.id;
    }

    return null;
  };

  const { mutateAsync: createProject, isPending: isCreating } =
    useCreateProject({
      onSuccess: (data) => {
        const projectId = getProjectIdFromResponse(data);
        if (projectId) {
          setEditId(projectId);
        }
        setSessionName(data.session_name);
      },
    });

  useEffect(() => {
    const sourceUrl = searchParams.get("src");
    if (!sourceUrl || activeEditId || !user?.id) {
      return;
    }

    if (bootstrappedSourceRef.current === sourceUrl) {
      return;
    }

    const findVideoIdByUrl = (url: string) => {
      const matched = highlightVideos.find((video) => video.url === url);
      return matched?.video_id ?? matched?.id;
    };

    const resolveVideoIdByUrl = async (url: string) => {
      let videoId = findVideoIdByUrl(url);
      if (videoId) return videoId;

      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const refreshed = await refetchHighlightVideos();
        const matched = refreshed.data?.find((video) => video.url === url);
        videoId = matched?.video_id ?? matched?.id;
        if (videoId) return videoId;
      }

      return undefined;
    };

    let cancelled = false;

    const bootstrapProjectFromSource = async () => {
      setIsBootstrappingProject(true);
      try {
        const resolvedVideoId =
          selectedVideoId ?? (await resolveVideoIdByUrl(sourceUrl));

        if (!resolvedVideoId || cancelled) {
          return;
        }

        bootstrappedSourceRef.current = sourceUrl;
        const now = new Date();
        const projectName = `Project ${now.toLocaleDateString("vi-VN")}`;

        const createdProject = await createProject({
          session_name: projectName,
          video_id: resolvedVideoId,
        });

        if (cancelled) return;

        const projectId = getProjectIdFromResponse(createdProject);
        if (projectId) {
          setEditId(projectId);
          setSessionName(projectName);

          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.set("edit_id", String(projectId));
          nextParams.set("src", sourceUrl);
          nextParams.set("video_id", String(resolvedVideoId));
          nextParams.delete("editId");
          nextParams.delete("editid");

          const nextQuery = nextParams.toString();
          const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
          router.replace(nextUrl, { scroll: false });
        }
      } finally {
        if (!cancelled) {
          setIsBootstrappingProject(false);
        }
      }
    };

    void bootstrapProjectFromSource();

    return () => {
      cancelled = true;
    };
  }, [
    activeEditId,
    createProject,
    highlightVideos,
    pathname,
    refetchHighlightVideos,
    router,
    searchParams,
    selectedVideoId,
    user?.id,
  ]);

  const { mutateAsync: updateProject, isPending: isUpdating } =
    useUpdateProject({
      onSuccess: (data) => {
        setSessionName(data.session_name);
      },
    });

  const { mutateAsync: createLayer, isPending: isCreatingLayer } =
    useCreateLayer();
  const { mutateAsync: updateLayer, isPending: isUpdatingLayer } =
    useUpdateLayer();
  const { mutateAsync: deleteLayer, isPending: isDeletingLayer } =
    useDeleteLayer();

  const isLoading =
    highlightVideosLoading ||
    mascotImagesLoading ||
    isCreating ||
    isUpdating ||
    isCreatingLayer ||
    isUpdatingLayer ||
    isDeletingLayer;

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);

    // No edit_id => keep current query (e.g. src/video_id from upload flow)
    // so users can still open editor with a selected source video.
    if (!activeEditId) {
      return;
    }

    // With edit_id, hydrate src/video_id from project so /editor?edit_id=... can reopen project.
    const projectVideoId = currentProject?.video_id;
    if (!projectVideoId) return;

    const matchedVideo = highlightVideos.find(
      (video) => (video.video_id ?? video.id) === projectVideoId,
    );

    if (!matchedVideo?.url) return;

    const currentSrc = params.get("src");
    const currentVideoId = params.get("video_id") ?? params.get("videoId");

    if (
      currentSrc === matchedVideo.url &&
      currentVideoId === String(projectVideoId)
    ) {
      return;
    }

    params.set("src", matchedVideo.url);
    params.set("video_id", String(projectVideoId));
    params.delete("videoId");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    activeEditId,
    currentProject,
    highlightVideos,
    currentQuery,
    pathname,
    router,
    isCreating,
    isBootstrappingProject,
  ]);

  const handleCreateProject = async (name: string) => {
    if (!user?.id) return;
    const createdProject = await createProject({
      session_name: name,
      video_id: selectedVideoId,
    });
    const projectId = getProjectIdFromResponse(createdProject);
    if (projectId) setEditId(projectId);
  };

  const handleStartEmptyProject = () => {
    // Prefer true back navigation for the header back button.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    // Fallback when opened directly (no usable history entry).
    router.push("/");
  };

  const handleCreateProjectOnFirstVideo = async (payload?: {
    file?: File;
    url?: string;
    videoId?: number;
  }) => {
    if (!user?.id || isCreating || isUpdating) return;

    const findVideoIdByUrl = (url: string) => {
      const matched = highlightVideos.find((video) => video.url === url);
      return matched?.video_id ?? matched?.id;
    };

    const resolveVideoIdByUrl = async (url: string) => {
      let videoId = findVideoIdByUrl(url);
      if (videoId) return videoId;

      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const refreshed = await refetchHighlightVideos();
        const matched = refreshed.data?.find((video) => video.url === url);
        videoId = matched?.video_id ?? matched?.id;
        if (videoId) return videoId;
      }

      return undefined;
    };

    let resolvedVideoId = payload?.videoId ?? selectedVideoId;

    if (!resolvedVideoId && payload?.url) {
      resolvedVideoId = await resolveVideoIdByUrl(payload.url);
    }

    if (activeEditId) {
      if (resolvedVideoId) {
        await updateProject({
          id: activeEditId,
          data: {
            video_id: resolvedVideoId,
            status: "draft",
          },
        });
      }
      return;
    }

    if (!resolvedVideoId && payload?.url) {
      toast.warning(
        "Video vừa upload chưa đồng bộ xong. Hãy chọn lại video từ danh sách bên trái sau vài giây.",
      );
      return;
    }

    setIsBootstrappingProject(true);
    try {
      const now = new Date();
      const name = `Project ${now.toLocaleDateString("vi-VN")}`;
      const createdProject = await createProject({
        session_name: name,
        video_id: resolvedVideoId,
      });
      const projectId = getProjectIdFromResponse(createdProject);
      if (projectId) setEditId(projectId);
    } finally {
      setIsBootstrappingProject(false);
    }
  };

  const handleStartFromHighlight = async (video: {
    id?: number;
    video_id?: number;
    url: string;
  }) => {
    setIsBootstrappingProject(true);
    const matched = highlightVideos.find((v) => v.url === video.url);
    const videoId =
      video.video_id ?? video.id ?? matched?.video_id ?? matched?.id;

    const params = new URLSearchParams(currentQuery);
    params.set("src", video.url);
    if (videoId) {
      params.set("video_id", String(videoId));
    } else {
      params.delete("video_id");
    }
    params.delete("videoId");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });

    try {
      const now = new Date();
      const name = `Project ${now.toLocaleDateString("vi-VN")}`;
      const createdProject = await createProject({
        session_name: name,
        video_id: videoId,
      });

      const projectId = getProjectIdFromResponse(createdProject);
      if (projectId) setEditId(projectId);
    } catch (error) {
      console.error("Create project from highlight failed:", error);
      toast.error("Tạo project thất bại");
      throw error;
    } finally {
      setIsBootstrappingProject(false);
    }
  };

  const handleSelectMascotImage = (image: {
    image_id?: number;
    url: string;
  }) => {
    const imageId = image.image_id ?? null;
    setSelectedMascotImageId(
      typeof imageId === "number" && imageId > 0 ? imageId : null,
    );
  };

  const handleSaveSession = async (
    name: string,
    bindings?: ExternalEditorPanelBindings | null,
  ) => {
    if (!activeEditId) return;

    await updateProject({
      id: activeEditId,
      data: {
        session_name: name,
        status: "saved",
      },
    });

    if (!bindings) return;

    const overlayId =
      bindings.existingMascotOverlayId ?? existingMascotOverlayId ?? null;

    if (bindings.mascot.type === "none") {
      if (overlayId && overlayId > 0) {
        await deleteLayer(overlayId);
      }
      return;
    }

    const placement = bindings.mascot.previewPlacement;
    const position_x = placement
      ? Math.round(placement.x)
      : bindings.mascot.margin_x;
    const position_y = placement
      ? Math.round(placement.y)
      : bindings.mascot.margin_y;

    const payload = {
      image_id:
        selectedMascotImageId ?? existingMascotOverlay?.image_id ?? undefined,
      position_x,
      position_y,
      scale: normalizeMascotScale(bindings.mascot.scale),
      start_time: 0,
      end_time: 1,
      layer_index: 1,
    };

    if (overlayId && overlayId > 0) {
      await updateLayer({
        id: overlayId,
        data: payload,
      });
      return;
    }

    try {
      await createLayer({
        edit_id: activeEditId,
        ...payload,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes("edit_id should not exist")) {
        await createLayer(payload as typeof payload & { edit_id?: never });
      } else {
        throw error;
      }
    }
  };

  const handleFinalizeMascotProject = async (payload?: {
    videoId?: number;
    videoUrl?: string;
  }) => {
    if (!activeEditId) return;

    await updateProject({
      id: activeEditId,
      data: {
        status: "finalized",
      },
    });

    if (payload?.videoUrl) {
      router.replace("/library", { scroll: false });
    }
  };

  return {
    activeEditId,
    activeSessionName,
    isLoading,
    highlightVideos,
    highlightVideosLoading,
    mascotVideos: mascotImages,
    mascotVideosLoading: mascotImagesLoading,
    selectedMascotImageId,
    existingMascotOverlay,
    existingMascotOverlayId,
    handleCreateProject,
    handleStartEmptyProject,
    handleCreateProjectOnFirstVideo,
    handleStartFromHighlight,
    handleSelectMascotVideo: handleSelectMascotImage,
    handleSaveSession,
    handleFinalizeMascotProject,
  };
}
