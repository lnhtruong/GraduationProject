/**
 * Image Hooks
 * TanStack Query hooks for image CRUD
 */

import { useQuery } from "@tanstack/react-query";
import { createMutationHooks } from "@/features/_shared/hooks";
import { createKeyFactory } from "@/lib/queryKeys";
import { imageApi } from "./image.api";
import type {
	CreateImageRequest,
	DeleteImageResponse,
	Image,
	UpdateImageMutationVariables,
} from "../types";

const keys = createKeyFactory("image");

export const imageKeys = keys;

export function useImageById(id: number, enabled = true) {
	return useQuery({
		queryKey: keys.detail(id),
		queryFn: () => imageApi.findById(id),
		enabled: enabled && !!id,
	});
}

export function useImagesByUser(enabled = true) {
	return useQuery({
		queryKey: keys.custom("user", "list"),
		queryFn: () => imageApi.getAllByUser(),
		enabled,
	});
}

const useCreateImageBase = createMutationHooks<Image, CreateImageRequest>(
	"image",
	"create",
	imageApi.create,
	{
		onSuccess: (_data, _variables, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
		},
	},
);

export function useCreateImage(options?: {
	onSuccess?: (data: Image) => void;
	onError?: (error: Error) => void;
}) {
	return useCreateImageBase(options);
}

const useUpdateImageBase = createMutationHooks<Image, UpdateImageMutationVariables>(
	"image",
	"update",
	({ id, data }) => imageApi.updateById(id, data),
	{
		onSuccess: (updatedImage, _variables, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
			queryClient.setQueryData(keys.detail(updatedImage.id), updatedImage);
		},
	},
);

export function useUpdateImage(options?: {
	onSuccess?: (data: Image) => void;
	onError?: (error: Error) => void;
}) {
	return useUpdateImageBase(options);
}

const useDeleteImageBase = createMutationHooks<DeleteImageResponse, number>(
	"image",
	"delete",
	imageApi.deleteById,
	{
		onSuccess: (_data, deletedId, queryClient) => {
			queryClient.invalidateQueries({ queryKey: keys.root });
			queryClient.removeQueries({ queryKey: keys.detail(deletedId) });
		},
	},
);

export function useDeleteImage(options?: {
	onSuccess?: (data: DeleteImageResponse, id: number) => void;
	onError?: (error: Error) => void;
}) {
	return useDeleteImageBase(options);
}
