"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Film, ImageIcon, Users, VideoIcon } from "lucide-react";
import type { Image } from "@/features/image";
import type { Video } from "@/features/video";
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
	const library = useLibrary();
	const [activeTab, setActiveTab] = useState<LibraryTabValue>("video");
	const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
	const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);

	const tabStats = useMemo(
		() => ({
			video: library.highlightVideos.length,
			mascot: library.mascotVideos.length,
			image: library.images.length,
		}),
		[library.highlightVideos.length, library.images.length, library.mascotVideos.length],
	);

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
		<div className="bg-background">
			<section className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-3 px-4 py-4">
				<LibraryHeader
					totalCount={tabStats.video + tabStats.mascot + tabStats.image}
					onRefresh={() => {
						void library.refetchAll();
					}}
					onOpenEditor={() => {
						router.push("/editor");
					}}
				/>

				<div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/70 bg-card p-3 shadow-sm">
					<Tabs
						value={activeTab}
						onValueChange={(value) => {
							setActiveTab(value as LibraryTabValue);
						}}
						className="h-full"
					>
						<TabsList>
							<TabsTrigger value="video">
								<VideoIcon className="h-4 w-4" />
								{TAB_LABEL.video}
								<Badge variant="secondary">{tabStats.video}</Badge>
							</TabsTrigger>
							<TabsTrigger value="mascot">
								<Film className="h-4 w-4" />
								{TAB_LABEL.mascot}
								<Badge variant="secondary">{tabStats.mascot}</Badge>
							</TabsTrigger>
							<TabsTrigger value="image">
								<ImageIcon className="h-4 w-4" />
								{TAB_LABEL.image}
								<Badge variant="secondary">{tabStats.image}</Badge>
							</TabsTrigger>
							<TabsTrigger value="following">
								<Users className="h-4 w-4" />
								{TAB_LABEL.following}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="video" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
							<VideoGrid
								items={library.highlightVideos}
								tabLabel="Video"
								isLoading={library.isLoading}
								onPreview={(item) => {
									setPreviewItem({ kind: "video", item, label: `Video #${item.id}` });
								}}
								onDelete={(item) => {
									setDeleteDialog({
										tab: "video",
										id: item.id,
										label: `Video #${item.id}`,
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
									setPreviewItem({ kind: "video", item, label: `Mascot #${item.id}` });
								}}
								onDelete={(item) => {
									setDeleteDialog({
										tab: "mascot",
										id: item.id,
										label: `Mascot #${item.id}`,
									});
								}}
							/>
						</TabsContent>

						<TabsContent value="image" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
							<ImageGrid
								items={library.images}
								isLoading={library.isLoading}
								onPreview={(item) => {
									setPreviewItem({ kind: "image", item, label: `Image #${item.id}` });
								}}
								onDelete={(item) => {
									setDeleteDialog({
										tab: "image",
										id: item.id,
										label: `Image #${item.id}`,
									});
								}}
							/>
						</TabsContent>

						<TabsContent value="following" className="mt-3 h-[calc(100%-3rem)] overflow-auto pr-1">
							<FollowingInstructorsGrid />
						</TabsContent>
					</Tabs>
				</div>

				{library.error ? (
					<p className="text-sm text-destructive">{toErrorMessage(library.error)}</p>
				) : null}
			</section>

			<MediaPreviewDialog
				open={!!previewItem}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewItem(null);
					}
				}}
				preview={previewItem}
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

function toErrorMessage(error: unknown): string {
	return getUserFacingErrorMessage(
		error,
		"Hiện chưa thể tải thư viện. Vui lòng thử lại sau.",
	);
}
