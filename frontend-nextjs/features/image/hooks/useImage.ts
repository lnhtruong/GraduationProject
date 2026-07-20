"use client";

import { useCallback, useMemo, useState } from "react";
import {
	useCreateImage,
	useDeleteImage,
	useImageById,
	useImagesByUser,
	useUpdateImage,
} from "../api/image.hooks";
import type { CreateImageRequest, UpdateImageRequest } from "../types";

export function useImage(initialImageId?: number | null) {
	const [selectedImageId, setSelectedImageId] = useState<number | null>(
		initialImageId ?? null,
	);

	const imagesQuery = useImagesByUser(true);
	const selectedImageQuery = useImageById(
		selectedImageId ?? 0,
		selectedImageId !== null,
	);

	const createImageMutation = useCreateImage();
	const updateImageMutation = useUpdateImage();
	const deleteImageMutation = useDeleteImage();

	const createImage = useCallback(async (payload: CreateImageRequest) => {
		const created = await createImageMutation.mutateAsync(payload);
		setSelectedImageId(created.id);
		return created;
	}, [createImageMutation]);

	const updateImage = useCallback(async (id: number, payload: UpdateImageRequest) => {
		const updated = await updateImageMutation.mutateAsync({ id, data: payload });
		setSelectedImageId(updated.id);
		return updated;
	}, [updateImageMutation]);

	const deleteImage = useCallback(async (id: number) => {
		const result = await deleteImageMutation.mutateAsync(id);
		if (selectedImageId === id) {
			setSelectedImageId(null);
		}
		return result;
	}, [deleteImageMutation, selectedImageId]);

	const isLoading =
		imagesQuery.isLoading ||
		selectedImageQuery.isLoading ||
		createImageMutation.isPending ||
		updateImageMutation.isPending ||
		deleteImageMutation.isPending;

	const error =
		imagesQuery.error ||
		selectedImageQuery.error ||
		createImageMutation.error ||
		updateImageMutation.error ||
		deleteImageMutation.error;

	return useMemo(
		() => ({
			images: imagesQuery.data ?? [],
			selectedImage: selectedImageQuery.data ?? null,
			selectedImageId,
			setSelectedImageId,
			isLoading,
			error,
			refetchImages: imagesQuery.refetch,
			refetchSelectedImage: selectedImageQuery.refetch,
			createImage,
			updateImage,
			deleteImage,
			createImageMutation,
			updateImageMutation,
			deleteImageMutation,
		}),
		[
			imagesQuery.data,
			selectedImageQuery.data,
			selectedImageId,
			isLoading,
			error,
			imagesQuery.refetch,
			selectedImageQuery.refetch,
			createImage,
			updateImage,
			deleteImage,
			createImageMutation,
			updateImageMutation,
			deleteImageMutation,
		],
	);
}
