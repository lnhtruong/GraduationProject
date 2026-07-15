"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function LibraryFeature() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const library = useLibrary();
	const targetVideoId = Number(searchParams.get("video_id") ?? searchParams.get("videoId"));
	const targetType = searchParams.get("type");
	const [manualActiveTab, setManualActiveTab] =
		useState<LibraryTabValue | null>(null);
	const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
	const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);
	const [dismissedTargetVideoId, setDismissedTargetVideoId] = useState<number | null>(null);

	const tabStats = useMemo(
		() => ({
			video: library.highlightVideos.length,
			mascot: library.mascotVideos.length,
			image: library.images.length,
		}),
		[library.highlightVideos.length, library.images.length, library.mascotVideos.length],
	);

	const queryPreviewItem = useMemo<PreviewItem | null>(() => {
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
		dismissedTargetVideoId,
		library.highlightVideos,
		library.mascotVideos,
		targetVideoId,
	]);
	const effectivePreviewItem = previewItem ?? queryPreviewItem;
	const activeTab: LibraryTabValue =
		manualActiveTab ??
		(targetType === "mascot"
			? "mascot"
			: targetType === "video" || targetType === "highlight"
				? "video"
				: queryPreviewItem?.kind === "video" &&
						queryPreviewItem.item.type === "mascot"
					? "mascot"
					: "video");

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
				totalCount={tabStats.video + tabStats.mascot + tabStats.image}
				onRefresh={() => {
					void library.refetchAll();
				}}
				onOpenEditor={() => {
					router.push("/editor");
				}}
			/>

			<section className="mx-auto flex h-[calc(100vh-11rem)] min-h-[520px] w-full max-w-7xl flex-col gap-3 px-4 py-4 lg:px-8">
				<Card className="min-h-0 flex-1 overflow-hidden rounded-lg border-border/70 p-3 shadow-sm">
					<Tabs
						value={activeTab}
						onValueChange={(value) => {
							setManualActiveTab(value as LibraryTabValue);
						}}
						className="h-full"
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
							</TabsTrigger>
						</TabsList>

						<TabsContent value="video" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
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
							/>
						</TabsContent>

						<TabsContent value="mascot" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
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

						<TabsContent value="image" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
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

						<TabsContent value="following" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
							<FollowingInstructorsGrid />
						</TabsContent>
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
		</div>
	);
}

function getVideoLibraryLabel(item: { name?: string | null; type?: string }): string {
	const cleaned = formatLibraryLabel(item.name);
	if (cleaned) return cleaned;
	return item.type === "mascot" ? "Video mascot" : "Video highlight";
}

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
