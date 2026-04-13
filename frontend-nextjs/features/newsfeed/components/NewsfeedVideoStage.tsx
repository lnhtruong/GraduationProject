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
	onDescriptionOpenChange,
	onVideoMetadataLoaded,
	onVideoTimeUpdate,
	formatTime,
}: NewsfeedVideoStageProps) {
	const seekTrackRef = useRef<HTMLDivElement | null>(null);
	const [isSeeking, setIsSeeking] = useState(false);

	const isPortraitVideo = videoAspectRatio < 1;
	const shortDescription = useMemo(() => {
		const desc = video.description ?? "";
		if (desc.length <= 90) {
			return desc;
		}
		return `${desc.slice(0, 90)}...`;
	}, [video.description]);

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
				<div className="absolute inset-0 flex items-center justify-center px-4 md:px-8 pt-20 pb-5">
					<div
						className={cn(
							"relative",
							isPortraitVideo
								? "h-[calc(100vh-6rem)] aspect-[9/16]"
								: "w-[min(63vw,100%)] max-w-[min(63vw,100%)] aspect-video",
						)}
					>
						<div
							className="group relative h-full w-full overflow-hidden rounded-2xl border border-border/70 bg-background/70 shadow-2xl"
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

							<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/55" />

							<div
								className={cn(
									"absolute top-3 left-3 right-3 flex items-center justify-between transition-opacity duration-200",
									isHovered ? "opacity-100" : "opacity-0",
								)}
							>
								<div
									className="flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-2.5 py-1.5"
									onClick={(event) => event.stopPropagation()}
								>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 text-foreground hover:bg-accent/70"
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
											"h-1 accent-primary transition-all duration-200",
											isHovered ? "w-24 opacity-100" : "w-0 opacity-0",
										)}
									/>
								</div>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-full border border-border/70 bg-background/75 text-foreground hover:bg-accent/70"
											onClick={(event) => event.stopPropagation()}
										>
											<Ellipsis className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56" onClick={(event) => event.stopPropagation()}>
										<DropdownMenuLabel>Tuy chon video</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem><Settings2 className="h-4 w-4" />Chat luong</DropdownMenuItem>
										<DropdownMenuItem><Gauge className="h-4 w-4" />Toc do phat</DropdownMenuItem>
										<DropdownMenuItem><Subtitles className="h-4 w-4" />Phu de</DropdownMenuItem>
										<DropdownMenuItem><Volume className="h-4 w-4" />Cuon tu dong</DropdownMenuItem>
										<DropdownMenuItem><PictureInPicture2 className="h-4 w-4" />Picture in Picture</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem><XCircle className="h-4 w-4" />Khong quan tam</DropdownMenuItem>
										<DropdownMenuItem variant="destructive"><Flag className="h-4 w-4" />Bao cao</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div
								className={cn(
									"absolute left-0 right-0 bottom-2 px-4 transition-all duration-200",
									isDescriptionOpen ? "backdrop-blur-sm bg-background/50 pt-3 pb-10" : "pb-10",
								)}
								onClick={(event) => {
									event.stopPropagation();
								}}
							>
								<p className="text-lg md:text-2xl font-extrabold leading-tight text-foreground drop-shadow-md line-clamp-1">
									{video.course.name}
								</p>
								<p className={cn("mt-1 text-sm md:text-base text-foreground/90 leading-relaxed drop-shadow-sm", isDescriptionOpen ? "line-clamp-none" : "line-clamp-2") }>
									{isDescriptionOpen ? video.description : shortDescription}
									{(video.description?.length ?? 0) > 90 ? (
										<button
											type="button"
											onClick={(event) => {
												event.stopPropagation();
												onDescriptionOpenChange(!isDescriptionOpen);
											}}
											className="ml-1 inline-flex text-primary font-semibold"
										>
											{isDescriptionOpen ? "an bot" : "...xem them"}
										</button>
									) : null}
								</p>
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
								<div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted/80" />
								<div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary" style={{ width: `${progressPercent}%` }} />
								<div
									className={cn(
										"absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow transition-opacity",
										isHovered ? "opacity-100" : "opacity-0",
									)}
									style={{ left: `calc(${progressPercent}% - 6px)` }}
								/>
							</div>
						</div>

						<div
							className={cn(
								"absolute z-20 flex flex-col items-center gap-3",
								isPortraitVideo ? "-right-16 bottom-4" : "-right-18 bottom-6",
							)}
						>
							<Button
								onClick={(event) => {
									event.stopPropagation();
									onToggleCoursePanel();
								}}
								className="h-14 w-14 rounded-full border-2 border-border/80 bg-background/60 hover:bg-accent/70 transition shadow-xl shadow-background/30"
							>
								<Avatar className="h-12 w-12 border border-border/80">
									<AvatarImage src={video.course.thumbnail ?? undefined} />
									<AvatarFallback className="bg-primary/25 text-foreground text-sm font-semibold">
										{getInitials(video.course.name)}
									</AvatarFallback>
								</Avatar>
							</Button>

							<Button variant="ghost" className="h-12 w-12 rounded-full bg-background/60 text-foreground hover:bg-accent/70" onClick={(event) => event.stopPropagation()}>
								<Heart className="h-5 w-5" />
							</Button>
							<span className="text-xs text-foreground/90 font-semibold -mt-2">{video.stats.likes.toLocaleString("vi-VN")}</span>

							<Button variant="ghost" className="h-12 w-12 rounded-full bg-background/60 text-foreground hover:bg-accent/70" onClick={(event) => event.stopPropagation()}>
								<MessageCircle className="h-5 w-5" />
							</Button>
							<span className="text-xs text-foreground/90 font-semibold -mt-2">{video.stats.comments.toLocaleString("vi-VN")}</span>

							<Button variant="ghost" className="h-12 w-12 rounded-full bg-background/60 text-foreground hover:bg-accent/70" onClick={(event) => event.stopPropagation()}>
								<Bookmark className="h-5 w-5" />
							</Button>
							<span className="text-xs text-foreground/90 font-semibold -mt-2">{video.stats.saves.toLocaleString("vi-VN")}</span>

							<Button variant="ghost" className="h-12 w-12 rounded-full bg-background/60 text-foreground hover:bg-accent/70" onClick={(event) => event.stopPropagation()}>
								<Share2 className="h-5 w-5" />
							</Button>
							<span className="text-xs text-foreground/90 font-semibold -mt-2">{video.stats.shares.toLocaleString("vi-VN")}</span>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
