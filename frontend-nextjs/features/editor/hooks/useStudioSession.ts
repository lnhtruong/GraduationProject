"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useProjectLayers,
  useLayer,
  useCreateLayer,
  useUpdateLayer,
  useDeleteLayer,
} from "@/features/editor/api/mascot-overlay.hooks";
import {
  useProjectById,
  useCreateProject,
  useUpdateProject,
} from "@/features/project/api/project.hooks";
import { useImagesByUser } from "@/features/image/api/image.hooks";
import { imageApi } from "@/features/image/api/image.api";
import { useVideoById, useVideosByUser } from "@/features/video/api/video.hooks";
import type {
  ExternalEditorPanelBindings,
  MascotImage,
  UserVideo,
} from "@/features/editor/types";
import type { Project } from "@/features/project";
import {
  clampPreviewPlacement,
  normalizeMascotScale,
} from "@/features/editor/utils/mascotPlacement";
import { toast } from "sonner";
import type { Video } from "@/features/video";
import type { Image } from "@/features/image";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

function getErrorMessage(error: unknown): string {
  return getUserFacingErrorMessage(
    error,
    "Không thể tải phiên chỉnh sửa. Vui lòng thử lại.",
  );
}

function normalizeAssetUrl(value?: string) {
  if (!value) return "";
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    const fallbackOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    return new URL(value, siteUrl || fallbackOrigin).toString();
  } catch {
    return value;
  }
}

function normalizeComparableUrl(value?: string) {
  if (!value) return "";
  try {
    const parsed = new URL(normalizeAssetUrl(value));
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return value;
  }
}

export function useStudioSession() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [editId, setEditId] = useState<number | null>(null);
  const [sessionName, setSessionName] = useState("Dự án chưa đặt tên");
  const [isBootstrappingProject, setIsBootstrappingProject] = useState(false);
  const [selectedMascotImageId, setSelectedMascotImageId] = useState<
    number | null
  >(null);
  const bootstrappedSourceRef = useRef<number | null>(null);

  const rawEditId =
    searchParams.get("edit_id") ??
    searchParams.get("editId") ??
    searchParams.get("editid");
  const rawVideoId =
    searchParams.get("video_id") ?? searchParams.get("videoId");
  const querySourceUrl = searchParams.get("src") || undefined;
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
    data: rawHighlightVideos = [],
    isLoading: highlightVideosLoading,
    refetch: refetchHighlightVideos,
  } = useVideosByUser("highlight", true);
  const {
    data: rawMascotVideos = [],
    refetch: refetchMascotVideos,
  } = useVideosByUser("mascot", false);
  const { data: rawMascotImages = [], isLoading: mascotImagesLoading } =
    useImagesByUser(true);
  const { data: currentProject } = useProjectById(
    activeEditId ?? 0,
    activeEditId !== null,
  );
  const isProjectFinalized = currentProject?.status === "finalized";
  const { data: projectLayers = [] } = useProjectLayers(
    activeEditId,
    !isProjectFinalized,
  );
  const currentProjectVideoId = currentProject?.video_id ?? null;
  const shouldFetchProjectVideoById =
    currentProjectVideoId !== null &&
    !highlightVideosLoading &&
    !rawHighlightVideos.some((video) => video.id === currentProjectVideoId);
  const {
    data: projectVideoById,
    isLoading: projectVideoByIdLoading,
  } = useVideoById(currentProjectVideoId, shouldFetchProjectVideoById);
  const highlightVideos = useMemo<UserVideo[]>(
    () =>
      rawHighlightVideos.map((video: Video) => ({
        id: video.id,
        video_id: video.id,
        user_id: video.user_id ?? 0,
        image_id: video.image_id ?? undefined,
        name: video.name ?? null,
        url: video.url,
        duration: video.duration,
        type: video.type,
        thumbnail: video.thumbnail ?? null,
        image: video.image ?? null,
        created_at: video.created_at,
        updated_at: video.updated_at,
      })),
    [rawHighlightVideos],
  );
  const mascotImages = useMemo<MascotImage[]>(
    () =>
      rawMascotImages.map((image: Image) => ({
        image_id: image.id,
        user_id: image.user_id ?? 0,
        url: image.url,
        thumbnail: image.thumbnail ?? null,
        created_at: image.created_at,
        updated_at: image.updated_at,
        createdAt: image.created_at,
        updatedAt: image.updated_at,
      })),
    [rawMascotImages],
  );
  const ensureMascotImageId = async (url?: string) => {
    if (!url) return undefined;

    const absoluteUrl = normalizeAssetUrl(url);
    const matched = mascotImages.find(
      (image) =>
        normalizeComparableUrl(image.url) === normalizeComparableUrl(absoluteUrl),
    );
    if (matched?.image_id) return matched.image_id;

    const created = await imageApi.create({ url: absoluteUrl });
    return created.id || undefined;
  };
  const projectVideo = useMemo(
    () =>
      rawHighlightVideos.find((video) => video.id === currentProjectVideoId) ??
      projectVideoById ??
      null,
    [currentProjectVideoId, projectVideoById, rawHighlightVideos],
  );
  const queryVideo = useMemo(
    () =>
      selectedVideoId
        ? rawHighlightVideos.find((video) => video.id === selectedVideoId) ?? null
        : null,
    [rawHighlightVideos, selectedVideoId],
  );
  const firstOverlayId =
    !isProjectFinalized && projectLayers.length > 0
      ? projectLayers[0].mascot_overlay_id
      : null;
  const { data: overlayDetail } = useLayer(firstOverlayId);
  const activeSessionName = currentProject?.session_name ?? sessionName;
  const activeSourceVideoUrl =
    projectVideo?.url ??
    queryVideo?.url ??
    querySourceUrl ??
    undefined;
  const activeSourceVideoName =
    projectVideo?.name ??
    queryVideo?.name ??
    undefined;
  const existingMascotOverlay = useMemo(() => {
    if (isProjectFinalized) return null;

    const rawOverlay = overlayDetail ?? projectLayers[0] ?? null;
    if (!rawOverlay) return null;

    if (rawOverlay.mascotImage?.url) return rawOverlay;

    const imageId = rawOverlay.image_id;
    if (!imageId) return rawOverlay;

    const matchedImage = mascotImages.find((img) => img.image_id === imageId);
    if (!matchedImage?.url) return rawOverlay;

    return {
      ...rawOverlay,
      mascotImage: {
        image_id: matchedImage.image_id,
        user_id: matchedImage.user_id,
        url: matchedImage.url,
      },
    };
  }, [isProjectFinalized, overlayDetail, projectLayers, mascotImages]);
  const existingMascotOverlayId =
    existingMascotOverlay?.mascot_overlay_id ?? null;

  useEffect(() => {
    if (selectedMascotImageId || !existingMascotOverlay?.image_id) return;
    setSelectedMascotImageId(existingMascotOverlay.image_id);
  }, [existingMascotOverlay, selectedMascotImageId]);

  const { mutateAsync: createProject, isPending: isCreating } =
    useCreateProject({
      onSuccess: (data: Project) => {
        if (data.edit_id > 0) {
          setEditId(data.edit_id);
        }
        setSessionName(data.session_name);
      },
    });

  useEffect(() => {
    if (!selectedVideoId || activeEditId || !user?.id || isBootstrappingProject) {
      return;
    }

    if (bootstrappedSourceRef.current === selectedVideoId) {
      return;
    }

    let cancelled = false;

    const bootstrapProjectFromSource = async () => {
      setIsBootstrappingProject(true);
      try {
        const resolvedVideoId = selectedVideoId;

        if (!resolvedVideoId || cancelled) {
          return;
        }

        bootstrappedSourceRef.current = selectedVideoId;
        const now = new Date();
        const projectName = `Dự án ${now.toLocaleDateString("vi-VN")}`;

        const createdProject = await createProject({
          session_name: projectName,
          video_id: resolvedVideoId,
        });

        if (cancelled) return;

        const projectId = createdProject.edit_id;
        if (projectId) {
          setEditId(projectId);
          setSessionName(projectName);

          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.set("edit_id", String(projectId));
          nextParams.set("video_id", String(resolvedVideoId));
          nextParams.delete("src");
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
    pathname,
    router,
    searchParams,
    selectedVideoId,
    isBootstrappingProject,
    user?.id,
  ]);

  const { mutateAsync: updateProject, isPending: isUpdating } =
    useUpdateProject({
      onSuccess: (data: Project) => {
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
    projectVideoByIdLoading ||
    mascotImagesLoading ||
    isCreating ||
    isUpdating ||
    isCreatingLayer ||
    isUpdatingLayer ||
    isDeletingLayer ||
    isBootstrappingProject;

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);

    // No edit_id => keep current query (e.g. video_id from upload flow)
    // so users can still open editor with a selected source video.
    if (!activeEditId) {
      return;
    }

    // With edit_id, hydrate video_id from project so /editor?edit_id=... can reopen project.
    const projectVideoId = currentProject?.video_id;
    if (!projectVideoId) return;

    const currentVideoId = params.get("video_id") ?? params.get("videoId");

    if (currentVideoId === String(projectVideoId)) {
      return;
    }

    params.set("video_id", String(projectVideoId));
    params.delete("src");
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
    if (createdProject.edit_id > 0) setEditId(createdProject.edit_id);
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
    if (!user?.id || isCreating || isUpdating || isBootstrappingProject) return;

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
        videoId = matched?.id;
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
      bootstrappedSourceRef.current = resolvedVideoId ?? null;
      const now = new Date();
      const name = `Dự án ${now.toLocaleDateString("vi-VN")}`;
      const createdProject = await createProject({
        session_name: name,
        video_id: resolvedVideoId,
      });
      if (createdProject.edit_id > 0) {
        setEditId(createdProject.edit_id);
        setSessionName(name);
        const params = new URLSearchParams(currentQuery);
        params.delete("src");
        params.set("edit_id", String(createdProject.edit_id));
        if (resolvedVideoId) {
          params.set("video_id", String(resolvedVideoId));
        }
        params.delete("videoId");
        params.delete("editId");
        params.delete("editid");

        const nextQuery = params.toString();
        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        router.replace(nextUrl, { scroll: false });
      }
    } finally {
      setIsBootstrappingProject(false);
    }
  };

  const handleStartFromHighlight = async (video: {
    id?: number;
    video_id?: number;
    url: string;
    name?: string | null;
  }) => {
    const matched = highlightVideos.find((v) => v.url === video.url);
    const videoId = video.id ?? video.video_id ?? matched?.id;

    if (!videoId) {
      toast.warning("Không tìm thấy video_id của video đã chọn.");
      return;
    }

    const syncSelectedVideoToUrl = (projectId: number) => {
      const params = new URLSearchParams(currentQuery);
      params.delete("src");
      params.set("edit_id", String(projectId));
      params.set("video_id", String(videoId));
      params.delete("videoId");
      params.delete("editId");
      params.delete("editid");

      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    };

    if (activeEditId) {
      setIsBootstrappingProject(true);
      try {
        await updateProject({
          id: activeEditId,
          data: {
            video_id: videoId,
            status: "draft",
          },
        });
        syncSelectedVideoToUrl(activeEditId);
      } catch (error) {
        console.error("Update project video failed:", error);
        toast.error("Cập nhật video cho dự án thất bại");
        throw error;
      } finally {
        setIsBootstrappingProject(false);
      }
      return;
    }

    setIsBootstrappingProject(true);
    try {
      bootstrappedSourceRef.current = videoId;
      const now = new Date();
      const name = `Dự án ${now.toLocaleDateString("vi-VN")}`;
      const createdProject = await createProject({
        session_name: name,
        video_id: videoId,
      });

      if (createdProject.edit_id > 0) {
        setEditId(createdProject.edit_id);
        setSessionName(name);
        syncSelectedVideoToUrl(createdProject.edit_id);
      }
    } catch (error) {
      console.error("Create project from highlight failed:", error);
      toast.error("Tạo dự án thất bại");
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

    const updateProjectPromise = updateProject({
      id: activeEditId,
      data: {
        session_name: name,
        status: "saved",
      },
    });

    if (!bindings) {
      await updateProjectPromise;
      return;
    }

    const saveOverlayPromise = (async () => {
      const overlayId =
        bindings.existingMascotOverlayId ?? existingMascotOverlayId ?? null;

      if (bindings.mascot.type === "none") {
        if (overlayId && overlayId > 0) {
          await deleteLayer(overlayId);
        }
        return;
      }

      const placement =
        bindings.mascot.previewPlacement && bindings.mascotFrameSize
          ? clampPreviewPlacement(
              bindings.mascot.previewPlacement,
              bindings.mascotFrameSize,
              bindings.mascot.scale,
              bindings.mascot.sourceWidth,
              bindings.mascot.sourceHeight,
            )
          : bindings.mascot.previewPlacement;
      const position_x = Math.round(
        placement ? placement.x : bindings.mascot.margin_x,
      );
      const position_y = Math.round(
        placement ? placement.y : bindings.mascot.margin_y,
      );
      const imageId =
        bindings.mascot.imageId ??
        selectedMascotImageId ??
        existingMascotOverlay?.image_id ??
        (await ensureMascotImageId(bindings.mascot.presetUrl));

      const payload = {
        image_id: imageId,
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
    })();

    await Promise.all([updateProjectPromise, saveOverlayPromise]);
  };

  const handleFinalizeMascotProject = async (payload?: {
    videoId?: number;
    videoUrl?: string;
  }) => {
    if (!activeEditId) return;

    let resolvedVideoId = payload?.videoId;

    if (!resolvedVideoId && payload?.videoUrl) {
      const normalizeUrl = (value?: string) => {
        if (!value) return "";
        try {
          const parsed = new URL(value);
          return `${parsed.origin}${parsed.pathname}`;
        } catch {
          return value;
        }
      };
      const targetUrl = normalizeUrl(payload.videoUrl);
      const findMascotVideoIdByUrl = (videos: Video[] | undefined) => {
        const matched = videos?.find(
          (video) => normalizeUrl(video.url) === targetUrl,
        );
        return matched?.id;
      };

      resolvedVideoId = findMascotVideoIdByUrl(rawMascotVideos);

      for (let attempt = 0; !resolvedVideoId && attempt < 15; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const refreshed = await refetchMascotVideos();
        resolvedVideoId = findMascotVideoIdByUrl(refreshed.data);
      }
    }

    if (!resolvedVideoId) {
      throw new Error(
        "Video mascot đã xử lý xong nhưng chưa được lưu vào thư viện. Vui lòng chờ ít phút rồi thử lại.",
      );
    }

    await updateProject({
      id: activeEditId,
      data: {
        status: "finalized",
      },
    });

    const params = new URLSearchParams();
    params.set("type", "mascot");
    params.set("video_id", String(resolvedVideoId));
    router.replace(`/library?${params.toString()}`, { scroll: false });
  };

  return {
    activeEditId,
    activeSessionName,
    activeSourceVideoUrl,
    activeSourceVideoName,
    isProjectFinalized,
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
