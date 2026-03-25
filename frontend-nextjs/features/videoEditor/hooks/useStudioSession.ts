"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useProject,
  useCreateProject,
  useUpdateProject,
  useUserHighlightVideos,
  useUserMascotVideos,
} from "@/features/videoEditor/api/editSession.hooks";

export function useStudioSession() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const [editId, setEditId] = useState<number | null>(null);
  const [sessionName, setSessionName] = useState("Untitled Project");
  const [isBootstrappingProject, setIsBootstrappingProject] = useState(false);

  const rawEditId = searchParams.get("edit_id") ?? searchParams.get("editId");
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
  const { data: mascotVideos = [], isLoading: mascotVideosLoading } =
    useUserMascotVideos(user?.id || null);
  const { data: currentProject } = useProject(activeEditId);
  const activeSessionName = currentProject?.session_name ?? sessionName;

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

  const { mutateAsync: updateProject, isPending: isUpdating } =
    useUpdateProject({
      onSuccess: (data) => {
        setSessionName(data.session_name);
      },
    });

  const isLoading =
    highlightVideosLoading || mascotVideosLoading || isCreating || isUpdating;

  useEffect(() => {
    const params = new URLSearchParams(currentQuery);

    // No edit_id => always keep editor as empty draft state.
    if (!activeEditId) {
      if (!isCreating && !isBootstrappingProject) {
        params.delete("src");
        params.delete("video_id");
        params.delete("videoId");

        const nextQuery = params.toString();
        const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        const currentUrl = currentQuery
          ? `${pathname}?${currentQuery}`
          : pathname;

        if (nextUrl !== currentUrl) {
          router.replace(nextUrl, { scroll: false });
        }
      }
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
    setIsBootstrappingProject(false);
    setEditId(null);
    setSessionName("Untitled Project");

    const params = new URLSearchParams(currentQuery);
    params.delete("edit_id");
    params.delete("editId");
    params.delete("video_id");
    params.delete("videoId");
    params.delete("src");

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
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
      alert(
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
      alert("Tạo project thất bại");
      throw error;
    } finally {
      setIsBootstrappingProject(false);
    }
  };

  const handleSaveSession = async (name: string) => {
    if (!activeEditId) return;
    await updateProject({
      id: activeEditId,
      data: {
        session_name: name,
        status: "saved",
      },
    });
  };

  return {
    activeEditId,
    activeSessionName,
    isLoading,
    highlightVideos,
    highlightVideosLoading,
    mascotVideos,
    mascotVideosLoading,
    handleCreateProject,
    handleStartEmptyProject,
    handleCreateProjectOnFirstVideo,
    handleStartFromHighlight,
    handleSaveSession,
  };
}
