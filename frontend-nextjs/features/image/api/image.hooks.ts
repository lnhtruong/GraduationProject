/**
 * Image Hooks
 * TanStack Query hooks for image CRUD
 */

import { createCrudHooks } from "@/features/_shared/crud-hooks";
import { imageApi } from "./image.api";
import type {
	CreateImageRequest,
	DeleteImageResponse,
	Image,
	UpdateImageRequest,
} from "../types";

const imageCrudHooks = createCrudHooks<
	Image,
	CreateImageRequest,
	UpdateImageRequest,
	number
>("image", imageApi);

export const imageKeys = imageCrudHooks.keys;

export function useImageById(id: number, enabled = true) {
	return imageCrudHooks.useDetail(id, enabled);
}

export function useImagesByUser(enabled = true) {
	return imageCrudHooks.useList(undefined, enabled);
}

export function useCreateImage(options?: {
	onSuccess?: (data: Image) => void;
	onError?: (error: Error) => void;
}) {
	return imageCrudHooks.useCreate({
		onSuccess: (data) => options?.onSuccess?.(data),
		onError: options?.onError,
	});
}

export function useUpdateImage(options?: {
	onSuccess?: (data: Image) => void;
	onError?: (error: Error) => void;
}) {
	return imageCrudHooks.useUpdate({
		onSuccess: (data) => options?.onSuccess?.(data),
		onError: options?.onError,
	});
}

export function useDeleteImage(options?: {
	onSuccess?: (data: DeleteImageResponse, id: number) => void;
	onError?: (error: Error) => void;
}) {
	return imageCrudHooks.useDelete({
		onSuccess: (data, id) =>
			options?.onSuccess?.(data as DeleteImageResponse, id),
		onError: options?.onError,
	});
}
