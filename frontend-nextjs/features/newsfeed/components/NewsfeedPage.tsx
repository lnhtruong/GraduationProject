"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
	ArrowBigDownDash,
	ArrowBigUpDash,
	BookOpenCheck,
	Bookmark,
	ChevronRight,
	ChevronsRight,
	Clapperboard,
	Compass,
	Heart,
	Info,
	MessageCircle,
	PanelLeftOpen,
	Pause,
	Play,
	Search,
	Share2,
	Star,
	UserCircle2,
	Volume2,
	VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/PageLoader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useNewsfeed } from "../hooks/useNewsfeed";

const MENU_ITEMS = [
	{ id: "for-you", label: "Danh cho ban", icon: Compass },
	{ id: "my-courses", label: "Khoa hoc cua toi", icon: BookOpenCheck },
	{ id: "saved", label: "Da luu", icon: Bookmark },
	{ id: "profile", label: "Ho so", icon: UserCircle2 },
];

function getInitials(name?: string | null) {
	if (!name) {
		return "KH";
	}
	const parts = name.trim().split(" ");
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return `${parts[0][0] ?? "K"}${parts[parts.length - 1][0] ?? "H"}`.toUpperCase();
}

export function NewsfeedPage() {
	const {
		activeIndex,
		activeVideo,
		isCoursePanelOpen,
		isHudVisible,
		isLoading,
		isMenuOpen,
		totalVideos,
		onTouchEnd,
		onTouchStart,
		onWheelCapture,
		goNext,
		goPrev,
		closeCoursePanel,
		toggleCoursePanel,
		toggleMenu,
		openMenu,
		closeMenu,
		wakeHud,
	} = useNewsfeed();
	const { user } = useAuth();
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);

	useEffect(() => {
		const videoElement = videoRef.current;
		if (!videoElement || !activeVideo) {
			return;
		}

		setIsPaused(false);
		videoElement.currentTime = 0;

		const playCurrentVideo = async () => {
			videoElement.muted = isMuted;
			try {
				await videoElement.play();
			} catch {
				// Browser autoplay policies can block unmuted playback until user interaction.
				videoElement.muted = true;
				setIsMuted(true);
				try {
					await videoElement.play();
				} catch {
					// Ignore hard autoplay failures; user can tap play.
				}
			}
		};

		void playCurrentVideo();
	}, [activeVideo, isMuted]);

	const handleTogglePlay = async () => {
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
	};

	const handleToggleMute = () => {
		wakeHud();
		setIsMuted((current) => {
			const next = !current;
			if (videoRef.current) {
				videoRef.current.muted = next;
			}
			return next;
		});
	};

	const handleSeek = (nextTime: number) => {
		const videoElement = videoRef.current;
		if (!videoElement || Number.isNaN(nextTime)) {
			return;
		}

		const clamped = Math.max(0, Math.min(nextTime, duration || 0));
		videoElement.currentTime = clamped;
		setCurrentTime(clamped);
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
			<div className="h-screen bg-background">
				<PageLoader message="Dang tai video cho newsfeed demo..." className="h-full" />
			</div>
		);
	}

	if (!activeVideo) {
		return (
			<div className="h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
				<Clapperboard className="h-12 w-12 text-primary" />
				<h2 className="text-2xl font-bold">Chua co video de demo</h2>
				<p className="text-muted-foreground max-w-xl">
					Hay upload it nhat mot video, newsfeed se lay du lieu tu API getAllByUser de
					tao trai nghiem luot vo tan tam thoi.
				</p>
				<Button asChild>
					<Link href="/upload">Di den trang upload</Link>
				</Button>
			</div>
		);
	}

	const hudBaseOpacity = isHudVisible ? "opacity-100" : "opacity-35";

	return (
		<div
			className="relative h-screen overflow-hidden bg-black text-white"
			onMouseMove={wakeHud}
			onWheel={onWheelCapture}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
		>
			<div
				className={cn(
					"absolute inset-0 transition-all duration-500 ease-out z-10",
					isCoursePanelOpen ? "right-[min(42vw,520px)]" : "right-0",
				)}
				onClick={() => {
					void handleTogglePlay();
				}}
			>
				<video
					key={activeVideo.id}
					ref={videoRef}
					src={activeVideo.videoUrl}
					className="h-full w-full object-cover"
					autoPlay
					loop
					playsInline
					muted={isMuted}
					onLoadedMetadata={(event) => {
						setDuration(event.currentTarget.duration || 0);
					}}
					onTimeUpdate={(event) => {
						setCurrentTime(event.currentTarget.currentTime || 0);
					}}
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/55" />
				{isPaused ? (
					<div className="pointer-events-none absolute inset-0 grid place-items-center">
						<div className="h-16 w-16 rounded-full bg-black/45 border border-white/25 flex items-center justify-center">
							<Play className="h-7 w-7 text-white" />
						</div>
					</div>
				) : null}
			</div>

			<div
				className={cn(
					"absolute inset-0 transition-all duration-500 ease-out z-20",
					isCoursePanelOpen ? "right-[min(42vw,520px)]" : "right-0",
				)}
			>
				<div
					className={cn(
						"absolute top-0 left-0 right-0 px-3 md:px-6 pt-2 md:pt-4 transition-opacity duration-300",
						hudBaseOpacity,
					)}
				>
					<div className="rounded-2xl bg-black/28 border border-white/15 backdrop-blur-md px-3 md:px-4 h-14 flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="text-white/90 hover:text-white hover:bg-white/15"
							onClick={openMenu}
						>
							<PanelLeftOpen className="h-5 w-5" />
						</Button>

						<div className="hidden md:flex items-center gap-2 flex-1 max-w-sm">
							<Search className="h-4 w-4 text-white/70" />
							<Input
								placeholder="Tim khoa hoc..."
								className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/65"
							/>
						</div>

						<div className="mx-auto">
							<Button
								asChild
								className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold shadow-xl shadow-white/20"
							>
								<Link href="/">Ve trang chu</Link>
							</Button>
						</div>

						<div className="ml-auto flex items-center gap-2">
							<Avatar className="h-8 w-8 border border-white/25">
								<AvatarImage src={undefined} />
								<AvatarFallback className="text-xs bg-white/15 text-white">
									{getInitials(user?.firstName ?? user?.email ?? "U")}
								</AvatarFallback>
							</Avatar>
						</div>
					</div>
				</div>

				<div
					className={cn(
						"absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 transition-opacity",
						hudBaseOpacity,
					)}
				>
					<div className="relative h-32 md:h-40 w-12 flex items-center justify-center">
						<Image
							src="/logo.png"
							alt="LearnHub"
							width={52}
							height={52}
							className="rotate-90 opacity-80"
						/>
					</div>
					<Button
						size="icon"
						variant="ghost"
						onClick={toggleMenu}
						className="h-10 w-10 rounded-full text-white/70 bg-white/10 hover:bg-white/25 hover:text-white hover:scale-110 transition"
					>
						<ChevronRight className="h-5 w-5" />
					</Button>
				</div>

				<div className="absolute right-4 md:right-6 bottom-8 z-20 flex flex-col gap-3">
					<Button
						size="icon"
						className="h-11 w-11 rounded-full bg-white/20 hover:bg-white/35 text-white"
						onClick={handleToggleMute}
					>
						{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
					</Button>
					<Button
						size="icon"
						className="h-11 w-11 rounded-full bg-white/20 hover:bg-white/35 text-white"
						onClick={() => {
							void handleTogglePlay();
						}}
					>
						{isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
					</Button>
					<Button
						size="icon"
						className="h-11 w-11 rounded-full bg-white/20 hover:bg-white/35 text-white"
						onClick={() => {
							wakeHud();
							goPrev();
						}}
					>
						<ArrowBigUpDash className="h-5 w-5" />
					</Button>
					<Button
						size="icon"
						className="h-11 w-11 rounded-full bg-white/20 hover:bg-white/35 text-white"
						onClick={() => {
							wakeHud();
							goNext();
						}}
					>
						<ArrowBigDownDash className="h-5 w-5" />
					</Button>
				</div>

				<div className="absolute right-5 md:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
					<Button
						onClick={toggleCoursePanel}
						className="h-14 w-14 rounded-full border-2 border-white/55 bg-white/15 hover:bg-white/25 transition shadow-xl shadow-black/30"
					>
						<Avatar className="h-12 w-12 border border-white/70">
							<AvatarImage src={activeVideo.course.thumbnail ?? undefined} />
							<AvatarFallback className="bg-primary/25 text-white text-sm font-semibold">
								{getInitials(activeVideo.course.title)}
							</AvatarFallback>
						</Avatar>
					</Button>

					<div className="flex flex-col gap-3">
						<Button variant="ghost" className="h-12 w-12 rounded-full bg-white/15 text-white hover:bg-white/25">
							<Heart className="h-5 w-5" />
						</Button>
						<Button variant="ghost" className="h-12 w-12 rounded-full bg-white/15 text-white hover:bg-white/25">
							<MessageCircle className="h-5 w-5" />
						</Button>
						<Button variant="ghost" className="h-12 w-12 rounded-full bg-white/15 text-white hover:bg-white/25">
							<Bookmark className="h-5 w-5" />
						</Button>
						<Button variant="ghost" className="h-12 w-12 rounded-full bg-white/15 text-white hover:bg-white/25">
							<Share2 className="h-5 w-5" />
						</Button>
					</div>
				</div>

				<div className="absolute bottom-5 left-20 md:left-28 right-24 md:right-28 z-20">
					<div className="pointer-events-none rounded-2xl bg-black/25 border border-white/15 p-4 md:p-5 backdrop-blur-md">
						<p className="text-xs uppercase tracking-[0.22em] text-white/80">Newsfeed Demo</p>
						<h2 className="mt-1 text-lg md:text-2xl font-semibold">{activeVideo.title}</h2>
						<p className="mt-1 text-sm md:text-base text-white/80 line-clamp-2">{activeVideo.description}</p>
						<div className="mt-3 flex items-center gap-4 text-xs md:text-sm text-white/85">
							<span>{activeVideo.stats.likes.toLocaleString("vi-VN")} tim</span>
							<span>{activeVideo.stats.comments.toLocaleString("vi-VN")} binh luan</span>
							<span>{activeVideo.stats.shares.toLocaleString("vi-VN")} chia se</span>
							<span>#{activeIndex + 1}/{totalVideos}</span>
						</div>
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 z-20 px-4 md:px-6 pb-2">
					<div className="rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm px-3 py-2">
						<div className="flex items-center gap-3">
							<input
								type="range"
								min={0}
								max={Math.max(duration, 0.001)}
								step={0.1}
								value={Math.min(currentTime, duration || 0)}
								onChange={(event) => {
									handleSeek(Number(event.target.value));
								}}
								className="w-full accent-primary"
							/>
							<span className="shrink-0 text-xs text-white/85 tabular-nums">
								{formatTime(currentTime)} / {formatTime(duration)}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div
				className={cn(
					"absolute right-0 top-0 h-full w-full max-w-[min(42vw,520px)] bg-background/95 text-foreground border-l border-border p-6 backdrop-blur-sm transition-transform duration-500",
					isCoursePanelOpen ? "translate-x-0" : "translate-x-full",
				)}
			>
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onClick={closeCoursePanel}
					className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-11 w-11 rounded-r-full rounded-l-none border border-border bg-card/95 shadow-md"
				>
					<ChevronsRight className="h-5 w-5" />
				</Button>

				<div className="h-full flex flex-col gap-5">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-bold">Thong tin khoa hoc</h3>
						<Button variant="ghost" size="icon" onClick={closeCoursePanel}>
							<ChevronRight className="h-5 w-5" />
						</Button>
					</div>
					<div className="rounded-xl border border-border bg-card p-4 flex gap-4 items-start">
						<Avatar className="h-16 w-16 rounded-xl">
							<AvatarImage src={activeVideo.course.thumbnail ?? undefined} />
							<AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
								{getInitials(activeVideo.course.title)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="font-semibold text-base truncate">{activeVideo.course.title}</p>
							<p className="text-sm text-muted-foreground">{activeVideo.course.instructor}</p>
							<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
								<span>{activeVideo.course.level}</span>
								<span>{activeVideo.course.durationLabel}</span>
								<span>{activeVideo.course.totalLessons} bai</span>
							</div>
						</div>
					</div>
					<div className="rounded-xl border border-border p-4 space-y-3 bg-card">
						<p className="text-sm leading-6 text-muted-foreground">{activeVideo.course.description}</p>
						<div className="flex flex-wrap gap-2">
							{activeVideo.course.tags.map((tag) => (
								<span
									key={tag}
									className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"
								>
									#{tag}
								</span>
							))}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div className="rounded-xl border border-border p-3 bg-card">
							<p className="text-muted-foreground">Hoc vien</p>
							<p className="font-semibold">{activeVideo.course.students.toLocaleString("vi-VN")}</p>
						</div>
						<div className="rounded-xl border border-border p-3 bg-card">
							<p className="text-muted-foreground">Danh gia</p>
							<p className="font-semibold flex items-center gap-1">
								<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
								{activeVideo.course.rating}/5
							</p>
						</div>
					</div>
					<Button className="mt-auto" asChild>
						<Link href="/courses">Kham pha khoa hoc day du</Link>
					</Button>
				</div>
			</div>


			<Sheet open={isMenuOpen} onOpenChange={(open) => (open ? openMenu() : closeMenu())}>
				<SheetContent side="left" className="w-[88%] sm:w-[360px] bg-background">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<Image src="/logo.png" alt="LearnHub" width={28} height={28} />
							LearnHub Menu
						</SheetTitle>
						<SheetDescription>
							Menu demo cho trang luot video. Sau nay co the doi sang menu thuc.
						</SheetDescription>
					</SheetHeader>
					<div className="px-4 pb-6 space-y-2">
						{MENU_ITEMS.map((item) => {
							const Icon = item.icon;
							return (
								<button
									key={item.id}
									type="button"
									className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition"
								>
									<Icon className="h-4 w-4 text-primary" />
									<span className="font-medium">{item.label}</span>
								</button>
							);
						})}
						<Button asChild className="w-full mt-3">
							<Link href="/">Ve trang chu</Link>
						</Button>
						<Button variant="outline" asChild className="w-full">
							<Link href="/courses">Kham pha khoa hoc</Link>
						</Button>
						<Button variant="ghost" asChild className="w-full">
							<Link href="/profile">
								<Info className="h-4 w-4" />
								Thong tin tai khoan
							</Link>
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
