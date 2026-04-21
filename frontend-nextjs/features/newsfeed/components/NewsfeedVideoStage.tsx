import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Bookmark,
	Ellipsis,
	Flag,
	Gauge,
	Heart,
	MessageCircle,
	PictureInPicture2,
	Settings2,
	Share2,
	Subtitles,
	Volume,
	Volume2,
	VolumeX,
	XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import { getInitials } from "./newsfeed-ui";

function sanitizeDescriptionHtml(input?: string) {
	if (!input) {
		return "";
	}

	return input
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
		.replace(/\son\w+=("[^"]*"|'[^']*')/gi, "")
		.replace(/javascript:/gi, "");
}

function stripHtml(input?: string) {
	const safeHtml = sanitizeDescriptionHtml(input);
	return safeHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface NewsfeedVideoStageProps {
	video: NewsfeedItem;
	isCoursePanelOpen: boolean;
	isMuted: boolean;
	volume: number;
	isHovered: boolean;
	isDescriptionOpen: boolean;
	duration: number;
	currentTime: number;
	videoAspectRatio: number;
	videoRef: React.RefObject<HTMLVideoElement | null>;
	onHoverChange: (hovered: boolean) => void;
	onTogglePlay: () => void;
	onToggleMute: () => void;
	onVolumeChange: (value: number) => void;
	onSeek: (value: number) => void;
	onToggleCoursePanel: () => void;
	onOpenComments: () => void;
	onDescriptionOpenChange: (open: boolean) => void;
	onVideoMetadataLoaded: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
	onVideoTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
	formatTime: (seconds: number) => string;
}

export function NewsfeedVideoStage({
	video,
	isCoursePanelOpen,
	isMuted,
	volume,
	isHovered,
	isDescriptionOpen,
	duration,
	currentTime,
	videoAspectRatio,
	videoRef,
	onHoverChange,
	onTogglePlay,
	onToggleMute,
	onVolumeChange,
	onSeek,
	onToggleCoursePanel,
	onOpenComments,
	onDescriptionOpenChange,
	onVideoMetadataLoaded,
	onVideoTimeUpdate,
	formatTime,
}: NewsfeedVideoStageProps) {
	const seekTrackRef = useRef<HTMLDivElement | null>(null);
	const [isSeeking, setIsSeeking] = useState(false);
    const channelName = useMemo(() => {
		const first = video.lecturer?.firstName?.trim();
		const last = video.lecturer?.lastName?.trim();
		const full = `${first ?? ""} ${last ?? ""}`.trim();
		return full || video.course.name;
	}, [video.course.name, video.lecturer?.firstName, video.lecturer?.lastName]);

	const isPortraitVideo = videoAspectRatio < 1;
	const descriptionText = useMemo(() => stripHtml(video.description), [video.description]);
	const safeDescriptionHtml = useMemo(
		() => sanitizeDescriptionHtml(video.description),
		[video.description],
	);
	const shortDescription = useMemo(() => {
		const desc = descriptionText;
		if (desc.length <= 90) {
			return desc;
		}
		return `${desc.slice(0, 90)}...`;
	}, [descriptionText]);

	const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

	const seekFromClientX = useCallback(
		(clientX: number) => {
			const track = seekTrackRef.current;
			if (!track || duration <= 0) {
				return;
			}

			const rect = track.getBoundingClientRect();
			const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
			const ratio = rect.width > 0 ? x / rect.width : 0;
			onSeek(ratio * duration);
		},
		[duration, onSeek],
	);

	useEffect(() => {
		if (!isSeeking) {
			return;
		}

		const onMove = (event: MouseEvent) => {
			seekFromClientX(event.clientX);
		};

		const onUp = () => {
			setIsSeeking(false);
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);

		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [isSeeking, seekFromClientX]);

	return (
		<>
			<div
				className={cn(
					"absolute inset-0 transition-all duration-500 ease-out z-10",
					isCoursePanelOpen ? "right-[min(42vw,520px)]" : "right-0",
				)}
			>
				<div className="absolute inset-0 flex items-center justify-center px-4 md:px-8 pt-20 pb-6">
					<div
						className={cn(
							"relative",
							isPortraitVideo
								? "h-[calc(100vh-6.8rem)] aspect-[9/16]"
								: "w-[min(58vw,980px)] max-w-[min(58vw,980px)] aspect-video",
						)}
					>
						<div
							className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
							onMouseEnter={() => onHoverChange(true)}
							onMouseLeave={() => onHoverChange(false)}
							onClick={onTogglePlay}
						>
							<video
								ref={videoRef}
								key={video.id}
								src={video.videoUrl}
								className="h-full w-full object-contain"
								autoPlay
								loop
								playsInline
								muted={isMuted}
								onLoadedMetadata={onVideoMetadataLoaded}
								onTimeUpdate={onVideoTimeUpdate}
							/>

							<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

							<div
								className={cn(
									"absolute top-3 left-3 right-3 flex items-center justify-between transition-opacity duration-200",
									isHovered ? "opacity-100" : "opacity-0",
								)}
							>
								<div
									className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-2.5 py-1.5"
									onClick={(event) => event.stopPropagation()}
								>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-white hover:bg-white/10"
										onClick={(event) => {
											event.stopPropagation();
											onToggleMute();
										}}
									>
										{isMuted || volume <= 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
									</Button>
									<input
										type="range"
										min={0}
										max={1}
										step={0.01}
										value={isMuted ? 0 : volume}
										onChange={(event) => onVolumeChange(Number(event.target.value))}
										className={cn(
											"h-1 accent-red-500 transition-all duration-200",
											isHovered ? "w-24 opacity-100" : "w-0 opacity-0",
										)}
									/>
								</div>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-full border border-white/15 bg-black/60 text-white hover:bg-white/10"
											onClick={(event) => event.stopPropagation()}
										>
											<Ellipsis className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56" onClick={(event) => event.stopPropagation()}>
										<DropdownMenuLabel>Tùy chọn video</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem><Settings2 className="h-4 w-4" />Chất lượng</DropdownMenuItem>
										<DropdownMenuItem><Gauge className="h-4 w-4" />Tốc độ phát</DropdownMenuItem>
										<DropdownMenuItem><Subtitles className="h-4 w-4" />Phụ đề</DropdownMenuItem>
										<DropdownMenuItem><Volume className="h-4 w-4" />Tự động cuộn</DropdownMenuItem>
										<DropdownMenuItem><PictureInPicture2 className="h-4 w-4" />Picture in Picture</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem><XCircle className="h-4 w-4" />Không quan tâm</DropdownMenuItem>
										<DropdownMenuItem variant="destructive"><Flag className="h-4 w-4" />Báo cáo</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div
								className={cn(
									"absolute left-0 right-0 bottom-2 px-4 transition-all duration-200",
									isDescriptionOpen ? "backdrop-blur-sm bg-black/55 pt-3 pb-10" : "pb-10",
								)}
								onClick={(event) => {
									event.stopPropagation();
								}}
							>
								<div className="flex items-center gap-2 text-sm text-white/95">
									<p className="font-semibold">@{channelName}</p>
									<Button
										type="button"
										size="sm"
										className="h-8 rounded-full bg-white text-black hover:bg-white/90"
										onClick={(event) => event.stopPropagation()}
									>
										Đăng ký
									</Button>
								</div>
								<p className="mt-1 text-lg md:text-xl font-bold leading-tight text-white line-clamp-1">
									{video.title}
								</p>
								{isDescriptionOpen ? (
									<div
										className="mt-2 max-h-36 overflow-y-auto pr-1 text-sm leading-relaxed text-white/90 [&_a]:text-red-300 [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc"
										dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
									/>
								) : (
									<p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed line-clamp-2">
										{shortDescription}
									</p>
								)}
								{descriptionText.length > 90 ? (
										<button
											type="button"
											onClick={(event) => {
												event.stopPropagation();
												onDescriptionOpenChange(!isDescriptionOpen);
											}}
											className="mt-1 inline-flex text-sm text-red-300 font-semibold"
										>
											{isDescriptionOpen ? "Ẩn bớt" : "Xem thêm"}
										</button>
									) : null}
								<div className="mt-2 flex flex-wrap gap-1.5">
									{video.hashtags.slice(0, 4).map((tag) => (
										<span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/90">
											#{tag}
										</span>
									))}
								</div>
							</div>

							<div
								ref={seekTrackRef}
								className="absolute left-0 right-0 bottom-0 h-2 cursor-pointer"
								onClick={(event) => {
									event.stopPropagation();
									seekFromClientX(event.clientX);
								}}
								onMouseDown={(event) => {
									event.stopPropagation();
									setIsSeeking(true);
									seekFromClientX(event.clientX);
								}}
							>
								<div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/30" />
								<div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-red-500" style={{ width: `${progressPercent}%` }} />
								<div
									className={cn(
										"absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-red-500 shadow transition-opacity",
										isHovered ? "opacity-100" : "opacity-0",
									)}
									style={{ left: `calc(${progressPercent}% - 6px)` }}
								/>
							</div>
						</div>

						<div
							className={cn(
								"absolute z-20 flex flex-col items-center gap-3",
								isPortraitVideo ? "-right-16 bottom-8" : "-right-18 bottom-8",
							)}
						>
							<Button
								onClick={(event) => {
									event.stopPropagation();
									onToggleCoursePanel();
								}}
								className="h-12 w-12 rounded-full border border-white/20 bg-black/65 hover:bg-white/10 transition"
							>
								<Avatar className="h-10 w-10 border border-white/20">
									<AvatarImage src={video.course.thumbnail ?? undefined} />
									<AvatarFallback className="bg-white/15 text-white text-sm font-semibold">
										{getInitials(video.course.name)}
									</AvatarFallback>
								</Avatar>
							</Button>

							<Button variant="ghost" className="h-11 w-11 rounded-full bg-black/65 text-white hover:bg-white/10" onClick={(event) => event.stopPropagation()}>
								<Heart className="h-5 w-5" />
							</Button>
							<span className="text-xs text-white/90 font-semibold -mt-2">{video.stats.likes.toLocaleString("vi-VN")}</span>

							<Button
								variant="ghost"
								className="h-11 w-11 rounded-full bg-black/65 text-white hover:bg-white/10"
								onClick={(event) => {
									event.stopPropagation();
									onOpenComments();
								}}
							>
								<MessageCircle className="h-5 w-5" />
							</Button>
							<span className="text-xs text-white/90 font-semibold -mt-2">{video.stats.comments.toLocaleString("vi-VN")}</span>

							<Button variant="ghost" className="h-11 w-11 rounded-full bg-black/65 text-white hover:bg-white/10" onClick={(event) => event.stopPropagation()}>
								<Bookmark className="h-5 w-5" />
							</Button>
							<span className="text-xs text-white/90 font-semibold -mt-2">{video.stats.saves.toLocaleString("vi-VN")}</span>

							<Button variant="ghost" className="h-11 w-11 rounded-full bg-black/65 text-white hover:bg-white/10" onClick={(event) => event.stopPropagation()}>
								<Share2 className="h-5 w-5" />
							</Button>
							<span className="text-xs text-white/90 font-semibold -mt-2">{video.stats.shares.toLocaleString("vi-VN")}</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
