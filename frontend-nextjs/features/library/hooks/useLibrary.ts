"use client";

import {
	useDeleteVideo,
	useVideosByUserPaginated,
} from "@/features/video";
import {
	useDeleteImage,
	useImagesByUserPaginated,
} from "@/features/image";
import { useFollowingInstructorsPaginated } from "@/features/instructor/follow/follow.hooks";
import type { LibraryTabValue } from "../types";

interface UseLibraryParams {
	activeTab: LibraryTabValue;
	page: number;
	limit: number;
}

export function useLibrary({ activeTab, page, limit }: UseLibraryParams) {
	const highlightVideosQuery = useVideosByUserPaginated("highlight", page, limit, true);
	const mascotVideosQuery = useVideosByUserPaginated("mascot", page, limit, true);
	const imagesQuery = useImagesByUserPaginated(page, limit, true);
	const followingQuery = useFollowingInstructorsPaginated(page, limit, true);

	const deleteVideoMutation = useDeleteVideo();

	const deleteImageMutation = useDeleteImage();

	const deleteVideoById = async (id: number) => {
		return deleteVideoMutation.mutateAsync(id);
	};

	const deleteImageById = async (id: number) => {
		return deleteImageMutation.mutateAsync(id);
	};

	const isLoading =
		(activeTab === "video" && highlightVideosQuery.isLoading) ||
		(activeTab === "mascot" && mascotVideosQuery.isLoading) ||
		(activeTab === "image" && imagesQuery.isLoading) ||
		(activeTab === "following" && followingQuery.isLoading) ||
		deleteVideoMutation.isPending ||
		deleteImageMutation.isPending;

	const error =
		(activeTab === "video" ? highlightVideosQuery.error : null) ||
		(activeTab === "mascot" ? mascotVideosQuery.error : null) ||
		(activeTab === "image" ? imagesQuery.error : null) ||
		(activeTab === "following" ? followingQuery.error : null) ||
		deleteVideoMutation.error ||
		deleteImageMutation.error;

	return {
		highlightVideos: highlightVideosQuery.data?.data ?? [],
		mascotVideos: mascotVideosQuery.data?.data ?? [],
		images: imagesQuery.data?.data ?? [],
		followingInstructors: followingQuery.data?.data ?? [],
		paginationByTab: {
			video: highlightVideosQuery.data?.pagination ?? createEmptyPagination(page, limit),
			mascot: mascotVideosQuery.data?.pagination ?? createEmptyPagination(page, limit),
			image: imagesQuery.data?.pagination ?? createEmptyPagination(page, limit),
			following: followingQuery.data?.pagination ?? createEmptyPagination(page, limit),
		},
		isLoading,
		error,
		refetchAll: async () => {
			await Promise.all([
				highlightVideosQuery.refetch(),
				mascotVideosQuery.refetch(),
				imagesQuery.refetch(),
				followingQuery.refetch(),
			]);
		},
		deleteVideoById,
		deleteImageById,
		deleteVideoMutation,
		deleteImageMutation,
	};
}

function createEmptyPagination(page: number, limit: number) {
	return {
		page,
		limit,
		totalItems: 0,
		totalPages: 0,
	};
}
