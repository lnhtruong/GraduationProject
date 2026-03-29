"use client";

import { useMemo } from "react";
import {
	useDeleteVideo,
	useVideosByUser,
} from "@/features/video";
import {
	useDeleteImage,
	useImagesByUser,
} from "@/features/image";

export function useLibrary() {
	const highlightVideosQuery = useVideosByUser("highlight", true);
	const mascotVideosQuery = useVideosByUser("mascot", true);
	const imagesQuery = useImagesByUser(true);

	const deleteVideoMutation = useDeleteVideo();

	const deleteImageMutation = useDeleteImage();

	const deleteVideoById = async (id: number) => {
		return deleteVideoMutation.mutateAsync(id);
	};

	const deleteImageById = async (id: number) => {
		return deleteImageMutation.mutateAsync(id);
	};

	const isLoading =
		highlightVideosQuery.isLoading ||
		mascotVideosQuery.isLoading ||
		imagesQuery.isLoading ||
		deleteVideoMutation.isPending ||
		deleteImageMutation.isPending;

	const error =
		highlightVideosQuery.error ||
		mascotVideosQuery.error ||
		imagesQuery.error ||
		deleteVideoMutation.error ||
		deleteImageMutation.error;

	return useMemo(
		() => ({
			highlightVideos: highlightVideosQuery.data ?? [],
			mascotVideos: mascotVideosQuery.data ?? [],
			images: imagesQuery.data ?? [],
			isLoading,
			error,
			refetchAll: async () => {
				await Promise.all([
					highlightVideosQuery.refetch(),
					mascotVideosQuery.refetch(),
					imagesQuery.refetch(),
				]);
			},
			deleteVideoById,
			deleteImageById,
			deleteVideoMutation,
			deleteImageMutation,
		}),
		[
			highlightVideosQuery.data,
			mascotVideosQuery.data,
			imagesQuery.data,
			isLoading,
			error,
			highlightVideosQuery.refetch,
			mascotVideosQuery.refetch,
			imagesQuery.refetch,
			deleteVideoMutation,
			deleteImageMutation,
		],
	);
}
