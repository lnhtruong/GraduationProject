/**
 * Video Hooks
 * TanStack Query hooks for video CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-hooks";
import { videoApi } from "./video.api";
import type {
	CreateVideoRequest,
	DeleteVideoResponse,
	UpdateVideoRequest,
	Video,
	VideoListType,
} from "../types";

const videoCrudHooks = createCrudHooks<
	Video,
	CreateVideoRequest,
	UpdateVideoRequest,
	number,
	number,
	VideoListType | null | undefined
>("video", videoApi);

export const videoKeys = videoCrudHooks.keys;

export function useVideoById(id: number, enabled = true) {
	return videoCrudHooks.useDetail(id, enabled);
}

export function useVideosByUser(type?: VideoListType | null, enabled = true) {
	return videoCrudHooks.useList(type, enabled);
}

export function useCreateVideo(options?: {
	onSuccess?: (data: Video) => void;
	onError?: (error: Error) => void;
}) {
	return videoCrudHooks.useCreate({
		onSuccess: (data) => options?.onSuccess?.(data),
		onError: options?.onError,
	});
}

export function useUpdateVideo(options?: {
	onSuccess?: (data: Video) => void;
	onError?: (error: Error) => void;
}) {
	return videoCrudHooks.useUpdate({
		onSuccess: (data) => options?.onSuccess?.(data),
		onError: options?.onError,
	});
}

export function useDeleteVideo(options?: {
	onSuccess?: (data: DeleteVideoResponse, id: number) => void;
	onError?: (error: Error) => void;
}) {
	return videoCrudHooks.useDelete({
		onSuccess: (data, id) =>
			options?.onSuccess?.(data as DeleteVideoResponse, id),
		onError: options?.onError,
	});
}

