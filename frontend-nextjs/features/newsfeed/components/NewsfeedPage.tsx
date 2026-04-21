"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { useNewsfeed } from "../hooks/useNewsfeed";
import { NewsfeedCommentsSheet } from "./NewsfeedCommentsSheet";
import { NewsfeedCoursePanel } from "./NewsfeedCoursePanel";
import { NewsfeedMenuSheet } from "./NewsfeedMenuSheet";
import { NewsfeedOverlayHud } from "./NewsfeedOverlayHud";
import { getInitials } from "./newsfeed-ui";
import { NewsfeedVideoStage } from "./NewsfeedVideoStage";

export function NewsfeedPage() {
	const {
		activeVideo,
		error,
		isCoursePanelOpen,
		isHudVisible,
		isLoading,
		isMenuOpen,
		onTouchEnd,
		onTouchStart,
		onWheelCapture,
		goNext,
		goPrev,
		endReached,
		closeCoursePanel,
		toggleCoursePanel,
		toggleMenu,
		openMenu,
		closeMenu,
		refetch,
		wakeHud,
	} = useNewsfeed();
	const { user } = useAuth();

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
	const [isMuted, setIsMuted] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [volume, setVolume] = useState(0.7);
	const [isPlayerHovered, setIsPlayerHovered] = useState(false);
	const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
	const [isCommentOpen, setIsCommentOpen] = useState(false);

	useEffect(() => {
		const videoElement = videoRef.current;
		if (!videoElement || !activeVideo) {
			return;
		}

		setIsPaused(false);
		setDuration(0);
		setCurrentTime(0);
		setVideoAspectRatio(16 / 9);
		setIsDescriptionOpen(false);
		videoElement.currentTime = 0;
		videoElement.muted = isMuted;
		videoElement.volume = volume;

		const playCurrentVideo = async () => {
			try {
				await videoElement.play();
			} catch {
				videoElement.muted = true;
				setIsMuted(true);
				try {
					await videoElement.play();
				} catch {
					// Ignore autoplay hard failures; user can click to play.
				}
			}
		};

		void playCurrentVideo();
	}, [activeVideo, isMuted, volume]);

	useEffect(() => {
		const videoElement = videoRef.current;
		if (!videoElement) {
			return;
		}
		videoElement.muted = isMuted;
		videoElement.volume = volume;
	}, [isMuted, volume]);

	const handleTogglePlay = useCallback(async () => {
		const videoElement = videoRef.current;
		if (!videoElement) {
			return;
		}

		wakeHud();
		if (videoElement.paused) {
			await videoElement.play();
			setIsPaused(false);
			return;
		}

		videoElement.pause();
		setIsPaused(true);
	}, [wakeHud]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.code !== "Space") {
				return;
			}

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

			event.preventDefault();
			void handleTogglePlay();
		};

		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [handleTogglePlay]);

	const handleToggleMute = useCallback(() => {
		wakeHud();
		setIsMuted((current) => {
			const next = !current;
			if (videoRef.current) {
				videoRef.current.muted = next;
			}
			if (!next && volume <= 0) {
				setVolume(0.5);
			}
			return next;
		});
	}, [volume, wakeHud]);

	const handleSeek = (nextTime: number) => {
		const videoElement = videoRef.current;
		if (!videoElement || Number.isNaN(nextTime)) {
			return;
		}

		const clamped = Math.max(0, Math.min(nextTime, duration || 0));
		videoElement.currentTime = clamped;
		setCurrentTime(clamped);
	};

	const handleVolumeChange = (value: number) => {
		const clamped = Math.max(0, Math.min(value, 1));
		setVolume(clamped);
		setIsMuted(clamped <= 0);
	};

	const formatTime = (seconds: number) => {
		if (!Number.isFinite(seconds) || seconds <= 0) {
			return "0:00";
		}

		const total = Math.floor(seconds);
		const mins = Math.floor(total / 60);
		const secs = total % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (isLoading) {
		return (
			<div className="h-screen bg-[#0f0f0f]">
				<PageLoader message="Đang tải video cho Newsfeed..." className="h-full" />
			</div>
		);
	}

	if (error) {
		const message = error instanceof Error ? error.message : "Không thể tải Newsfeed";

		return (
			<div className="h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
				<Clapperboard className="h-12 w-12 text-destructive" />
				<h2 className="text-2xl font-bold">Tải Newsfeed thất bại</h2>
				<p className="text-muted-foreground max-w-xl">
					{message}
				</p>
				<div className="flex items-center gap-3">
					<Button
						onClick={() => {
							void refetch();
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
			<div className="h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
				<Clapperboard className="h-12 w-12 text-primary" />
				<h2 className="text-2xl font-bold">Chưa có video để hiển thị</h2>
				<p className="text-muted-foreground max-w-xl">
					Hãy tải lên ít nhất một video, Newsfeed sẽ lấy dữ liệu từ API feed để
					tạo trải nghiệm lướt dọc liên tục.
				</p>
				<Button asChild>
					<Link href="/upload">Đi đến trang tải video</Link>
				</Button>
			</div>
		);
	}

	const hudBaseOpacity = isHudVisible ? "opacity-100" : "opacity-35";

	return (
		<div
			className="relative h-screen overflow-hidden bg-[#0f0f0f] text-white"
			onMouseMove={wakeHud}
			onWheel={onWheelCapture}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
		>
			<NewsfeedVideoStage
				video={activeVideo}
				isCoursePanelOpen={isCoursePanelOpen}
				isMuted={isMuted}
				volume={volume}
				isHovered={isPlayerHovered}
				isDescriptionOpen={isDescriptionOpen}
				duration={duration}
				currentTime={currentTime}
				videoAspectRatio={videoAspectRatio}
				videoRef={videoRef}
				onHoverChange={setIsPlayerHovered}
				onTogglePlay={() => {
					void handleTogglePlay();
				}}
				onToggleMute={handleToggleMute}
				onVolumeChange={handleVolumeChange}
				onSeek={handleSeek}
				onToggleCoursePanel={toggleCoursePanel}
				onOpenComments={() => setIsCommentOpen(true)}
				onDescriptionOpenChange={setIsDescriptionOpen}
				onVideoMetadataLoaded={(event) => {
					const { duration: mediaDuration, videoWidth, videoHeight } = event.currentTarget;
					setDuration(mediaDuration || 0);
					setVideoAspectRatio(videoWidth > 0 && videoHeight > 0 ? videoWidth / videoHeight : 16 / 9);
				}}
				onVideoTimeUpdate={(event) => {
					setCurrentTime(event.currentTarget.currentTime || 0);
				}}
				formatTime={formatTime}
			/>

			<NewsfeedOverlayHud
				hudBaseOpacity={hudBaseOpacity}
				isCoursePanelOpen={isCoursePanelOpen}
				userInitials={getInitials(user?.firstName ?? user?.email ?? "U")}
				onOpenMenu={openMenu}
				onToggleMenu={toggleMenu}
				onPrev={goPrev}
				onNext={goNext}
				onInteract={wakeHud}
			/>

			<NewsfeedCoursePanel video={activeVideo} isOpen={isCoursePanelOpen} onClose={closeCoursePanel} />
			<NewsfeedMenuSheet isOpen={isMenuOpen} onOpen={openMenu} onClose={closeMenu} />
			<NewsfeedCommentsSheet
				isOpen={isCommentOpen}
				onClose={() => setIsCommentOpen(false)}
				video={activeVideo}
				viewerName={user?.firstName ?? user?.email ?? "ban"}
			/>

			{endReached ? (
				<div className="pointer-events-none absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur">
					Bạn đã xem hết toàn bộ video được đề xuất trong hôm nay.
				</div>
			) : null}
		</div>
	);
}
