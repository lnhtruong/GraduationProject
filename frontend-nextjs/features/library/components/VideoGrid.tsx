import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { Clock3, Loader2, PlayCircle, Scissors, Trash2, VideoIcon } from "lucide-react";
import type { Video } from "@/features/video";

interface VideoGridProps {
	items: Video[];
	tabLabel: string;
	isLoading: boolean;
	onPreview: (item: Video) => void;
	onDelete: (item: Video) => void;
	/** Opens the segment-removal Sheet (spec 003-highlight-segment-removal). Highlight videos only. */
	onEditSegments?: (item: Video) => void;
}

export function VideoGrid({
	items,
	tabLabel,
	isLoading,
	onPreview,
	onDelete,
	onEditSegments,
}: VideoGridProps) {
	if (isLoading) {
		return <VideoGridSkeleton />;
	}

	if (items.length === 0) {
		return (
			<AppEmptyState
				icon={<VideoIcon className="h-8 w-8" />}
				title={`Chưa có ${tabLabel.toLowerCase()}`}
				description="Dữ liệu sẽ hiển thị tại đây khi bạn tạo thêm trong trang editor."
			/>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
			{items.map((item) => {
				const thumb = getVideoThumbnail(item);
				return (
					<Card key={item.id} className="overflow-hidden border-border/70 py-0">
						<button
							type="button"
							onClick={() => onPreview(item)}
							className="group w-full text-left"
						>
							<div className="relative aspect-video overflow-hidden border-b border-border/70 bg-muted">
								{thumb ? (
									<div
										className="h-full w-full bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.02]"
										style={{ backgroundImage: `url(${thumb})` }}
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-muted-foreground">
										<VideoIcon className="h-6 w-6" />
									</div>
								)}
								<div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
									<PlayCircle className="h-8 w-8 text-white" />
								</div>
							</div>
						</button>

						<CardContent className="space-y-2 px-3 pt-2.5 pb-2.5">
							<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<Clock3 className="h-3.5 w-3.5" />
									{formatDuration(item.duration)}
								</span>
								<span>{formatDate(item.created_at)}</span>
							</div>
							<div className="flex items-center justify-between gap-2">
								<span className="text-[11px] text-muted-foreground">{formatVideoKind(item.type)}</span>
								<div className="flex items-center gap-1">
									{item.type === "highlight" && onEditSegments && (
										<Button
											size="icon"
											variant="ghost"
											className="h-7 w-7 text-muted-foreground"
											disabled={Boolean(item.editing_job_id) || !item.original_video_id || !item.srt_raw_url}
											onClick={() => onEditSegments(item)}
											aria-label="Chỉnh sửa đoạn"
											title={
												item.editing_job_id
													? "Đang chỉnh sửa..."
													: !item.original_video_id || !item.srt_raw_url
														? "Không khả dụng cho video này"
														: "Chỉnh sửa đoạn"
											}
										>
											{item.editing_job_id ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Scissors className="h-4 w-4" />
											)}
										</Button>
									)}
									<Button
										size="icon"
										variant="ghost"
										className="h-7 w-7 text-destructive hover:bg-destructive/10"
										onClick={() => onDelete(item)}
										aria-label="Xóa video khỏi thư viện"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

function VideoGridSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
			{Array.from({ length: 10 }).map((_, index) => (
				<Card
					key={`video-grid-skeleton-${index}`}
					className="gap-0 rounded-lg border-border/70 p-2"
				>
					<Skeleton className="mb-2 aspect-video w-full rounded-lg" />
					<Skeleton className="mb-1.5 h-3 w-full" />
					<Skeleton className="h-3 w-1/2" />
				</Card>
			))}
		</div>
	);
}

function getVideoThumbnail(video: Video): string | null {
	return video.thumbnail ?? video.image?.thumbnail ?? video.image?.url ?? null;
}

function formatDate(raw?: string): string {
	if (!raw) return "-";
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleDateString("vi-VN");
}

function formatDuration(duration: number | null): string {
	if (duration === null || !Number.isFinite(duration)) return "00:00:00";
	const total = Math.max(0, Math.floor(duration));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatVideoKind(type: string): string {
	if (type === "mascot") return "Video hoàn chỉnh";
	if (type === "long" || type === "full") return "Video bài học";
	return "Video highlight";
}
