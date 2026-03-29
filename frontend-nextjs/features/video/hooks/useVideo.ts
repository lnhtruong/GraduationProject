"use client";

import { useMemo, useState } from "react";
import {
	useCreateVideo,
	useDeleteVideo,
	useVideoById,
	useVideosByUser,
	useUpdateVideo,
} from "../api/video.hooks";
import type {
	CreateVideoRequest,
	UpdateVideoRequest,
	VideoListType,
} from "../types";

export function useVideo(
	initialVideoId?: number | null,
	listType?: VideoListType | null,
) {
	const [selectedVideoId, setSelectedVideoId] = useState<number | null>(
		initialVideoId ?? null,
	);

	const videosQuery = useVideosByUser(listType, true);
	const selectedVideoQuery = useVideoById(
		selectedVideoId ?? 0,
		selectedVideoId !== null,
	);

	const createVideoMutation = useCreateVideo();
	const updateVideoMutation = useUpdateVideo();
	const deleteVideoMutation = useDeleteVideo();

	const createVideo = async (payload: CreateVideoRequest) => {
		const created = await createVideoMutation.mutateAsync(payload);
		setSelectedVideoId(created.id);
		return created;
	};

	const updateVideo = async (id: number, payload: UpdateVideoRequest) => {
		const updated = await updateVideoMutation.mutateAsync({ id, data: payload });
		setSelectedVideoId(updated.id);
		return updated;
	};

	const deleteVideo = async (id: number) => {
		const result = await deleteVideoMutation.mutateAsync(id);
		if (selectedVideoId === id) {
			setSelectedVideoId(null);
		}
		return result;
	};

	const isLoading =
		videosQuery.isLoading ||
		selectedVideoQuery.isLoading ||
		createVideoMutation.isPending ||
		updateVideoMutation.isPending ||
		deleteVideoMutation.isPending;

	const error =
		videosQuery.error ||
		selectedVideoQuery.error ||
		createVideoMutation.error ||
		updateVideoMutation.error ||
		deleteVideoMutation.error;

	return useMemo(
		() => ({
			videos: videosQuery.data ?? [],
			selectedVideo: selectedVideoQuery.data ?? null,
			selectedVideoId,
			setSelectedVideoId,
			isLoading,
			error,
			refetchVideos: videosQuery.refetch,
			refetchSelectedVideo: selectedVideoQuery.refetch,
			createVideo,
			updateVideo,
			deleteVideo,
			createVideoMutation,
			updateVideoMutation,
			deleteVideoMutation,
		}),
		[
			videosQuery.data,
			selectedVideoQuery.data,
			selectedVideoId,
			isLoading,
			error,
			videosQuery.refetch,
			selectedVideoQuery.refetch,
			createVideoMutation,
			updateVideoMutation,
			deleteVideoMutation,
		],
	);
}

