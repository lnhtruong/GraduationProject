/**
 * Video Hooks
 * TanStack Query hooks for video CRUD
 */

import { useQuery } from "@tanstack/react-query";
import { createMutationHooks } from "@/features/_shared/hooks";
import { createKeyFactory } from "@/lib/queryKeys";
import { videoApi } from "./video.api";
import type {
	CreateVideoRequest,
	DeleteVideoResponse,
	UpdateVideoMutationVariables,
	Video,
	VideoListType,
} from "../types";

const keys = createKeyFactory("video");

export const videoKeys = keys;

export function useVideoById(id: number, enabled = true) {
	return useQuery({
		queryKey: keys.detail(id),
		queryFn: () => videoApi.findById(id),
		enabled: enabled && !!id,
	});
}

export function useVideosByUser(type?: VideoListType | null, enabled = true) {
	return useQuery({
		queryKey: keys.custom("user", "list", type ?? "all"),
		queryFn: () => videoApi.getAllByUser(type),
		enabled,
	});
}

const useCreateVideoBase = createMutationHooks<Video, CreateVideoRequest>(
	"video",
	"create",
	videoApi.create,
	{
		onSuccess: (_data, _variables, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
		},
	},
);

export function useCreateVideo(options?: {
	onSuccess?: (data: Video) => void;
	onError?: (error: Error) => void;
}) {
	return useCreateVideoBase(options);
}

const useUpdateVideoBase = createMutationHooks<Video, UpdateVideoMutationVariables>(
	"video",
	"update",
	({ id, data }) => videoApi.updateById(id, data),
	{
		onSuccess: (updatedVideo, _variables, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
			queryClient.setQueryData(keys.detail(updatedVideo.id), updatedVideo);
		},
	},
);

export function useUpdateVideo(options?: {
	onSuccess?: (data: Video) => void;
	onError?: (error: Error) => void;
}) {
	return useUpdateVideoBase(options);
}

const useDeleteVideoBase = createMutationHooks<DeleteVideoResponse, number>(
	"video",
	"delete",
	videoApi.deleteById,
	{
		onSuccess: (_data, deletedId, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
			queryClient.removeQueries({ queryKey: keys.detail(deletedId) });
		},
	},
);

export function useDeleteVideo(options?: {
	onSuccess?: (data: DeleteVideoResponse, id: number) => void;
	onError?: (error: Error) => void;
}) {
	return useDeleteVideoBase(options);
}

