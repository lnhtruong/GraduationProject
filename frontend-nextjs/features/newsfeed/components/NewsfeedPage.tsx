"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowBigDownDash, ArrowBigUpDash, Clapperboard } from "lucide-react";
import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNewsfeedVideoFeed } from "../hooks/useNewsfeedVideoFeed";
import { useNewsfeedUiStore } from "../store/newsfeed-ui.store";
import { NewsfeedOptionBox } from "./NewsfeedOptionBox";
import { NewsfeedShareDialog } from "./NewsfeedShareDialog";
import { NewsfeedVideoFeed } from "./NewsfeedVideoFeed";
import { useNewsfeedHistory } from "../hooks/useNewsfeedHistory";

interface NewsfeedPageProps {
	initialVideoId?: number | null;
}

export function NewsfeedPage({ initialVideoId }: NewsfeedPageProps) {
	const feed = useNewsfeedVideoFeed(true, "", initialVideoId);
	const {
		isMenuOpen,
		isOptionBoxOpen,
		optionBoxContentType,
		closeMenu,
		openOptionBox,
		closeOptionBox,
		setActiveVideoId,
	} = useNewsfeedUiStore();
	const [shareOpen, setShareOpen] = useState(false);
	const [shareUrl, setShareUrl] = useState("");
	const { recordHistoryItem } = useNewsfeedHistory();

	const activeVideo = feed.activeVideo;

	useEffect(() => {
		setActiveVideoId(activeVideo?.id ?? null);
	}, [activeVideo?.id, setActiveVideoId]);

	useEffect(() => {
		if (!activeVideo) {
			return;
		}

		recordHistoryItem(activeVideo);
	}, [activeVideo, recordHistoryItem]);

	const { goNext, goPrev, jumpTo } = feed;

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const tagName = target?.tagName;
			const isEditable =
				tagName === "INPUT" ||
				tagName === "TEXTAREA" ||
				tagName === "SELECT" ||
				tagName === "BUTTON" ||
				Boolean(target?.isContentEditable);

			if (isEditable) {
				return;
			}

			if (event.code === "Space") {
				event.preventDefault();
				const element = document.querySelector(
					"video[data-active='true']",
				) as HTMLVideoElement | null;
				if (element) {
					if (element.paused) {
						void element.play();
					} else {
						element.pause();
					}
				}
			}

			if (event.key === "ArrowDown") {
				event.preventDefault();
				goNext();
			}

			if (event.key === "ArrowUp") {
				event.preventDefault();
				goPrev();
			}
		};

		window.addEventListener("keydown", onKeyDown, { passive: false });
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [goNext, goPrev]);

	const onOpenCourse = useCallback(() => {
		if (isOptionBoxOpen && optionBoxContentType === "course") {
			closeOptionBox();
			return;
		}
		openOptionBox("course");
	}, [closeOptionBox, isOptionBoxOpen, openOptionBox, optionBoxContentType]);

	const onOpenComments = useCallback(() => {
		if (isOptionBoxOpen && optionBoxContentType === "comments") {
			closeOptionBox();
			return;
		}
		openOptionBox("comments");
	}, [closeOptionBox, isOptionBoxOpen, openOptionBox, optionBoxContentType]);

	const onOpenShare = useCallback((url: string) => {
		setShareUrl(url);
		setShareOpen(true);
	}, []);

	const onActiveIndexChange = useCallback(
		(index: number) => {
			jumpTo(index);
		},
		[jumpTo],
	);

	if (feed.isLoading) {
		return (
			<div className="min-h-[calc(100vh-64px)] bg-background">
				<PageLoader message="Đang tải video cho bảng tin..." className="h-full" />
			</div>
		);
	}

	if (feed.error) {
		const message = feed.error instanceof Error ? feed.error.message : "Không thể tải bảng tin";

		return (
			<div className="min-h-[calc(100vh-64px)] bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
				<Clapperboard className="h-12 w-12 text-destructive" />
				<h2 className="text-2xl font-bold">Tải bảng tin thất bại</h2>
				<p className="text-muted-foreground max-w-xl">
					{message}
				</p>
				<div className="flex items-center gap-3">
					<Button
						onClick={() => {
							void feed.refetch();
						}}
					>
						Thử lại
					</Button>
					<Button asChild variant="outline">
						<Link href="/">Về trang chủ</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (!activeVideo) {
		return (
			<div className="min-h-[calc(100vh-64px)] bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
				<Clapperboard className="h-12 w-12 text-primary" />
				<h2 className="text-2xl font-bold">Chưa có video để hiển thị</h2>
				<p className="text-muted-foreground max-w-xl">
					Hãy tải lên ít nhất một video, bảng tin sẽ lấy dữ liệu từ API feed để
					tạo trải nghiệm lướt dọc liên tục.
				</p>
				<Button asChild>
					<Link href="/upload">Đi đến trang tải video</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/30 text-foreground dark:from-primary/10 dark:via-background dark:to-background">
			<main
				className={cn(
					"h-[calc(100vh-64px)] pt-0 transition-all duration-300",
					isMenuOpen ? "lg:pl-60" : "lg:pl-16",
					isOptionBoxOpen ? "md:pr-[592px] pr-[72px]" : "pr-[72px]",
				)}
			>
				<div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-center">
					<NewsfeedVideoFeed
						videos={feed.videos}
						activeIndex={feed.activeIndex}
						onActiveIndexChange={onActiveIndexChange}
						onOpenCourse={onOpenCourse}
						onOpenComments={onOpenComments}
						onOpenShare={onOpenShare}
						className="w-full"
					/>
				</div>
			</main>

			<NewsfeedOptionBox
				isOpen={isOptionBoxOpen}
				contentType={optionBoxContentType}
				video={activeVideo}
				viewerName="bạn"
				onClose={closeOptionBox}
			/>

			<NewsfeedShareDialog
				open={shareOpen}
				onOpenChange={setShareOpen}
				url={shareUrl}
			/>

			<div className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] w-[72px] flex-col items-center justify-center gap-3 border-l border-border/60 bg-background/90 backdrop-blur">
				<Button
					size="icon"
					className="h-11 w-11 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
					onClick={() => {
						goPrev();
					}}
				>
					<ArrowBigUpDash className="h-5 w-5" />
				</Button>
				<Button
					size="icon"
					className="h-11 w-11 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
					onClick={() => {
						goNext();
					}}
				>
					<ArrowBigDownDash className="h-5 w-5" />
				</Button>
			</div>

			{feed.endReached ? (
				<div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-background/90 px-4 py-2 text-xs shadow-lg">
					Đã xem hết video đề xuất.
				</div>
			) : null}
		</div>
	);
}
