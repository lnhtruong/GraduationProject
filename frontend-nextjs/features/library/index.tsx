"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Film, ImageIcon, Users, VideoIcon } from "lucide-react";
import { FollowingInstructorsGrid } from "./components/FollowingInstructorsGrid";
import { ImageGrid } from "./components/ImageGrid";
import { LibraryHeader } from "./components/LibraryHeader";
import { MediaPreviewDialog } from "./components/MediaPreviewDialog";
import { VideoGrid } from "./components/VideoGrid";
import { useLibrary } from "./hooks/useLibrary";
import {
	TAB_LABEL,
	type DeleteDialogState,
	type LibraryTabValue,
	type PreviewItem,
} from "./types";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import HighlightEditSheet from "@/features/highlight-edit/components/HighlightEditSheet";
import type { Video } from "@/features/video";

const LIBRARY_PAGE_SIZE = 12;

export default function LibraryFeature() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const targetVideoId = Number(searchParams.get("video_id") ?? searchParams.get("videoId"));
	const targetImageId = Number(searchParams.get("image_id") ?? searchParams.get("imageId"));
	const targetType = searchParams.get("type");
	const targetTab = toLibraryTabValue(searchParams.get("tab"));
	const page = parsePositiveInteger(searchParams.get("page"), 1);
	const activeTab: LibraryTabValue =
		targetTab ??
		(targetType === "mascot"
			? "mascot"
			: targetType === "image"
				? "image"
				: "video");
	const library = useLibrary({ activeTab, page, limit: LIBRARY_PAGE_SIZE });
	const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
	const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);
	const [dismissedTargetVideoId, setDismissedTargetVideoId] = useState<number | null>(null);
	const [dismissedTargetImageId, setDismissedTargetImageId] = useState<number | null>(null);
	const [editSegmentsVideo, setEditSegmentsVideo] = useState<Video | null>(null);

	const tabStats = useMemo(
		() => ({
			video: library.paginationByTab.video.totalItems,
			mascot: library.paginationByTab.mascot.totalItems,
			image: library.paginationByTab.image.totalItems,
			following: library.paginationByTab.following.totalItems,
		}),
		[library.paginationByTab],
	);

	const queryPreviewItem = useMemo<PreviewItem | null>(() => {
		if (Number.isFinite(targetImageId) && targetImageId > 0 && dismissedTargetImageId !== targetImageId) {
			const image = library.images.find((item) => item.id === targetImageId);
			if (image) {
				return {
					kind: "image",
					item: image,
					label: getImageLibraryLabel(image),
				};
			}
		}

		if (!Number.isFinite(targetVideoId) || targetVideoId <= 0) return null;
		if (dismissedTargetVideoId === targetVideoId) return null;

		const mascotVideo = library.mascotVideos.find((item) => item.id === targetVideoId);
		if (mascotVideo) {
			return {
				kind: "video",
				item: mascotVideo,
				label: getVideoLibraryLabel(mascotVideo),
			};
		}

		const highlightVideo = library.highlightVideos.find((item) => item.id === targetVideoId);
		if (highlightVideo) {
			return {
				kind: "video",
				item: highlightVideo,
				label: getVideoLibraryLabel(highlightVideo),
			};
		}

		return null;
	}, [
		dismissedTargetImageId,
		dismissedTargetVideoId,
		library.images,
		library.highlightVideos,
		library.mascotVideos,
		targetImageId,
		targetVideoId,
	]);
	const effectivePreviewItem = previewItem ?? queryPreviewItem;
	const activePagination = library.paginationByTab[activeTab];

	useEffect(() => {
		if (activePagination.totalPages <= 0 || page <= activePagination.totalPages) return;
		replaceLibraryParams({
			pathname,
			router,
			searchParams,
			tab: activeTab,
			page: activePagination.totalPages,
		});
	}, [activePagination.totalPages, activeTab, page, pathname, router, searchParams]);

	const handleDelete = async () => {
		if (!deleteDialog) return;

		try {
			if (deleteDialog.tab === "image") {
				await library.deleteImageById(deleteDialog.id);
				toast.success("Đã xóa hình ảnh");
			} else {
				await library.deleteVideoById(deleteDialog.id);
				toast.success("Đã xóa video");
			}
			setPreviewItem((prev) => {
				if (!prev) return null;
				return prev.item.id === deleteDialog.id ? null : prev;
			});
			setDeleteDialog(null);
		} catch (error) {
			toast.error("Không thể xóa", {
				description: toErrorMessage(error),
			});
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<LibraryHeader
				onRefresh={() => {
					void library.refetchAll();
				}}
				onOpenEditor={() => {
					router.push("/editor");
				}}
			/>

			<section className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 lg:px-8">
				<Card className="rounded-lg border-border/70 p-3 shadow-sm">
					<Tabs
						value={activeTab}
						onValueChange={(value) => {
							const nextTab = value as LibraryTabValue;
							replaceLibraryParams({
								pathname,
								router,
								searchParams,
								tab: nextTab,
								page: 1,
								clearPreviewParams: true,
							});
						}}
						className="space-y-3"
					>
						<TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
							<TabsTrigger value="video" className="min-w-0 gap-1.5 px-2">
								<VideoIcon className="h-4 w-4" />
								<span className="truncate">{TAB_LABEL.video}</span>
								<span className="text-xs text-muted-foreground tabular-nums">{tabStats.video}</span>
							</TabsTrigger>
							<TabsTrigger value="mascot" className="min-w-0 gap-1.5 px-2">
								<Film className="h-4 w-4" />
								<span className="truncate">{TAB_LABEL.mascot}</span>
								<span className="text-xs text-muted-foreground tabular-nums">{tabStats.mascot}</span>
							</TabsTrigger>
							<TabsTrigger value="image" className="min-w-0 gap-1.5 px-2">
								<ImageIcon className="h-4 w-4" />
								<span className="truncate">{TAB_LABEL.image}</span>
								<span className="text-xs text-muted-foreground tabular-nums">{tabStats.image}</span>
							</TabsTrigger>
							<TabsTrigger value="following" className="min-w-0 gap-1.5 px-2">
								<Users className="h-4 w-4" />
								<span className="truncate">{TAB_LABEL.following}</span>
								<span className="text-xs text-muted-foreground tabular-nums">{tabStats.following}</span>
							</TabsTrigger>
						</TabsList>

						<TabsContent value="video" className="mt-0">
							<VideoGrid
								items={library.highlightVideos}
								tabLabel="Video"
								isLoading={library.isLoading}
								onPreview={(item) => {
									setPreviewItem({ kind: "video", item, label: getVideoLibraryLabel(item) });
								}}
								onDelete={(item) => {
									setDeleteDialog({
										tab: "video",
										id: item.id,
										label: getVideoLibraryLabel(item),
									});
								}}
								onEditSegments={(item) => setEditSegmentsVideo(item)}
							/>
						</TabsContent>

						<TabsContent value="mascot" className="mt-0">
							<VideoGrid
								items={library.mascotVideos}
								tabLabel="Mascot"
								isLoading={library.isLoading}
								onPreview={(item) => {
									setPreviewItem({ kind: "video", item, label: getVideoLibraryLabel(item) });
								}}
								onDelete={(item) => {
									setDeleteDialog({
										tab: "mascot",
										id: item.id,
										label: getVideoLibraryLabel(item),
									});
								}}
							/>
						</TabsContent>

						<TabsContent value="image" className="mt-0">
							<ImageGrid
								items={library.images}
								isLoading={library.isLoading}
								onPreview={(item) => {
									setPreviewItem({ kind: "image", item, label: getImageLibraryLabel(item) });
								}}
								onDelete={(item) => {
									setDeleteDialog({
										tab: "image",
										id: item.id,
										label: getImageLibraryLabel(item),
									});
								}}
							/>
						</TabsContent>

						<TabsContent value="following" className="mt-0">
							<FollowingInstructorsGrid
								instructors={library.followingInstructors}
								isLoading={library.isLoading}
								error={activeTab === "following" ? library.error : null}
							/>
						</TabsContent>

						<LibraryPagination
							page={activePagination.page}
							totalPages={activePagination.totalPages}
							totalItems={activePagination.totalItems}
							limit={activePagination.limit}
							hrefForPage={(nextPage) =>
								getLibraryPageHref(pathname, searchParams, activeTab, nextPage)
							}
							onPageChange={(nextPage) => {
								replaceLibraryParams({
									pathname,
									router,
									searchParams,
									tab: activeTab,
									page: nextPage,
								});
							}}
						/>
					</Tabs>
				</Card>

				{library.error ? (
					<p className="text-sm text-destructive">{toErrorMessage(library.error)}</p>
				) : null}
			</section>

			<MediaPreviewDialog
				open={!!effectivePreviewItem}
				onOpenChange={(open) => {
					if (!open) {
						if (previewItem) {
							setPreviewItem(null);
						} else if (Number.isFinite(targetImageId) && targetImageId > 0) {
							setDismissedTargetImageId(targetImageId);
						} else if (Number.isFinite(targetVideoId) && targetVideoId > 0) {
							setDismissedTargetVideoId(targetVideoId);
						}
					}
				}}
				preview={effectivePreviewItem}
			/>

			<AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Bạn chắc chắn muốn xóa?</AlertDialogTitle>
						<AlertDialogDescription>
							Tệp này sẽ bị xóa vĩnh viễn khỏi thư viện của bạn: {deleteDialog?.label}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleDelete();
							}}
						>
							Xóa
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<HighlightEditSheet
				video={editSegmentsVideo}
				open={!!editSegmentsVideo}
				onOpenChange={(open) => {
					if (!open) setEditSegmentsVideo(null);
				}}
				onEditApplied={() => {
					void library.refetchAll();
				}}
			/>
		</div>
	);
}

function getVideoLibraryLabel(item: { name?: string | null; type?: string }): string {
	const cleaned = formatLibraryLabel(item.name);
	if (cleaned) return cleaned;
	return item.type === "mascot" ? "Video mascot" : "Video highlight";
}

function toLibraryTabValue(value: string | null): LibraryTabValue | null {
	if (value === "video" || value === "mascot" || value === "image" || value === "following") {
		return value;
	}
	return null;
}

function parsePositiveInteger(value: string | null, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getLibraryPageHref(
	pathname: string,
	searchParams: URLSearchParams | ReadonlyURLSearchParamsLike,
	tab: LibraryTabValue,
	page: number,
) {
	const nextParams = new URLSearchParams(searchParams.toString());
	nextParams.set("tab", tab);
	if (page > 1) {
		nextParams.set("page", String(page));
	} else {
		nextParams.delete("page");
	}
	const query = nextParams.toString();
	return query ? `${pathname}?${query}` : pathname;
}

function replaceLibraryParams({
	pathname,
	router,
	searchParams,
	tab,
	page,
	clearPreviewParams = false,
}: {
	pathname: string;
	router: { replace: (href: string, options?: { scroll?: boolean }) => void };
	searchParams: URLSearchParams | ReadonlyURLSearchParamsLike;
	tab: LibraryTabValue;
	page: number;
	clearPreviewParams?: boolean;
}) {
	const nextParams = new URLSearchParams(searchParams.toString());
	nextParams.set("tab", tab);
	if (page > 1) {
		nextParams.set("page", String(page));
	} else {
		nextParams.delete("page");
	}
	if (clearPreviewParams) {
		nextParams.delete("type");
		nextParams.delete("video_id");
		nextParams.delete("videoId");
	}
	const query = nextParams.toString();
	router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
}

function LibraryPagination({
	page,
	totalPages,
	totalItems,
	limit,
	hrefForPage,
	onPageChange,
}: {
	page: number;
	totalPages: number;
	totalItems: number;
	limit: number;
	hrefForPage: (page: number) => string;
	onPageChange: (page: number) => void;
}) {
	if (totalPages <= 1) return null;

	const pageNumbers = getVisiblePages(page, totalPages);
	const pageStart = totalItems === 0 ? 0 : (page - 1) * limit + 1;
	const pageEnd = Math.min(totalItems, page * limit);
	const prevPage = Math.max(1, page - 1);
	const nextPage = Math.min(totalPages, page + 1);

	return (
		<div className="flex flex-col items-center gap-2 border-t border-border/70 pt-3 sm:flex-row sm:justify-between">
			<p className="text-xs text-muted-foreground">
				Hiển thị {pageStart}-{pageEnd} / {totalItems}
			</p>
			<Pagination className="mx-0 w-auto">
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href={hrefForPage(prevPage)}
							aria-disabled={page <= 1}
							className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
							onClick={(event) => {
								event.preventDefault();
								if (page > 1) onPageChange(prevPage);
							}}
						/>
					</PaginationItem>
					{pageNumbers.map((pageNumber) => (
						<PaginationItem key={pageNumber}>
							<PaginationLink
								href={hrefForPage(pageNumber)}
								isActive={pageNumber === page}
								onClick={(event) => {
									event.preventDefault();
									onPageChange(pageNumber);
								}}
							>
								{pageNumber}
							</PaginationLink>
						</PaginationItem>
					))}
					<PaginationItem>
						<PaginationNext
							href={hrefForPage(nextPage)}
							aria-disabled={page >= totalPages}
							className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
							onClick={(event) => {
								event.preventDefault();
								if (page < totalPages) onPageChange(nextPage);
							}}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}

function getVisiblePages(page: number, totalPages: number): number[] {
	const start = Math.max(1, Math.min(page - 2, totalPages - 4));
	const end = Math.min(totalPages, start + 4);
	return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

type ReadonlyURLSearchParamsLike = {
	toString: () => string;
};

function getImageLibraryLabel(item: { created_at?: string }): string {
	const formattedDate = item.created_at ? new Date(item.created_at).toLocaleDateString("vi-VN") : "";
	return formattedDate ? `Hình ảnh ${formattedDate}` : "Hình ảnh thư viện";
}

function formatLibraryLabel(value?: string | null): string | null {
	const normalized = value?.trim();
	if (!normalized) return null;
	return normalized
		.replace(/\.[a-z0-9]{2,5}$/i, "")
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ");
}

function toErrorMessage(error: unknown): string {
	return getUserFacingErrorMessage(
		error,
		"Hiện chưa thể tải thư viện. Vui lòng thử lại sau.",
	);
}
