"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProject } from "@/features/project";
import { useVideo } from "@/features/video";
import type { Project, ProjectStatus } from "@/features/project";
import type { Video } from "@/features/video";
import {
	ArrowRight,
	Calendar,
	Clapperboard,
	FolderKanban,
	Plus,
	Sparkles,
} from "lucide-react";

export default function WorkspacePage() {
	return (
		<ProtectedRoute>
			<WorkspaceContent />
		</ProtectedRoute>
	);
}

function WorkspaceContent() {
	const router = useRouter();
	const { user } = useAuth();
	const [creatingFromVideoId, setCreatingFromVideoId] = useState<number | null>(
		null,
	);

	const {
		projects,
		isLoading: isProjectLoading,
		error: projectError,
		refetchProjects,
		createProject,
	} = useProject();

	const {
		videos,
		isLoading: isVideoLoading,
		error: videoError,
		refetchVideos,
	} = useVideo();

	const videosById = useMemo(
		() => new Map(videos.map((video) => [video.id, video])),
		[videos],
	);

	const handleCreateProject = () => {
		router.push("/editor");
	};

	const handleOpenProject = (project: Project) => {
		const params = new URLSearchParams();
		params.set("projectId", String(project.id));
		params.set("videoId", String(project.video_id));
		params.set("sessionName", project.session_name);

		const relatedVideo = videosById.get(project.video_id);
		if (relatedVideo?.url) {
			params.set("src", relatedVideo.url);
		}

		router.push(`/editor?${params.toString()}`);
	};

	const handleOpenVideo = async (video: Video) => {
		if (!user?.id) {
			return;
		}

		try {
			setCreatingFromVideoId(video.id);

			const newProject = await createProject({
				user_id: user.id,
				video_id: video.id,
				session_name: buildDefaultSessionName(video),
			});

			const params = new URLSearchParams();
			params.set("projectId", String(newProject.id));
			params.set("videoId", String(newProject.video_id));
			params.set("sessionName", newProject.session_name);
			if (video.url) {
				params.set("src", video.url);
			}

			router.push(`/editor?${params.toString()}`);
		} finally {
			setCreatingFromVideoId(null);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<section className="relative overflow-hidden border-b border-border/50">
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.14),transparent_40%),radial-gradient(circle_at_85%_15%,hsl(var(--accent)/0.18),transparent_42%)]" />
				<div className="container mx-auto px-4 py-10 lg:py-14">
					<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
						<div className="space-y-3">
							<p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
								<Sparkles className="h-3.5 w-3.5" />
								Không gian làm việc cá nhân
							</p>
							<h1 className="text-3xl font-bold tracking-tight md:text-4xl">
								Quản lý project và video của bạn
							</h1>
							<p className="max-w-2xl text-muted-foreground">
								Tiếp tục project đang làm hoặc chọn một video để tạo project mới
								và chuyển thẳng sang trình chỉnh sửa.
							</p>
						</div>

						<Button
							size="lg"
							onClick={handleCreateProject}
							className="shadow-md shadow-primary/25"
						>
							<Plus className="mr-2 h-4 w-4" />
							Tạo project
						</Button>
					</div>
				</div>
			</section>

			<section className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
					<Card className="border-border/70">
						<CardHeader className="border-b border-border/60 pb-5">
							<CardTitle className="flex items-center gap-2 text-xl">
								<FolderKanban className="h-5 w-5 text-primary" />
								Project đang làm
							</CardTitle>
							<CardDescription>
								Chọn project để mở lại phiên chỉnh sửa gần nhất của bạn.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-5">
							{isProjectLoading ? (
								<WorkspaceListSkeleton rows={5} />
							) : projectError ? (
								<ErrorState
									message={toErrorMessage(projectError)}
									onRetry={() => {
										void refetchProjects();
									}}
								/>
							) : projects.length === 0 ? (
								<EmptyState
									icon={<FolderKanban className="h-10 w-10 text-muted-foreground" />}
									title="Chưa có project nào"
									description="Bấm Tạo project hoặc chọn một video bên dưới để bắt đầu."
								/>
							) : (
								<ScrollArea className="h-[480px] pr-3">
									<div className="space-y-3">
										{projects.map((project) => (
											<button
												key={project.id}
												type="button"
												onClick={() => handleOpenProject(project)}
												className="w-full rounded-xl border border-border/70 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
											>
												<div className="flex items-start justify-between gap-4">
													<div className="min-w-0 flex-1">
														<p className="truncate text-base font-semibold">
															{project.session_name}
														</p>
														<p className="mt-1 text-sm text-muted-foreground">
															Project #{project.id} • Video #{project.video_id}
														</p>
													</div>
													<Badge
														variant={getProjectStatusBadgeVariant(project.status)}
													>
														{project.status}
													</Badge>
												</div>

												<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
													<span className="inline-flex items-center gap-1">
														<Calendar className="h-3.5 w-3.5" />
														{formatDate(project.updated_at || project.created_at)}
													</span>
													<span className="inline-flex items-center gap-1 font-medium text-primary">
														Mở editor
														<ArrowRight className="h-3.5 w-3.5" />
													</span>
												</div>
											</button>
										))}
									</div>
								</ScrollArea>
							)}
						</CardContent>
					</Card>

					<Card className="border-border/70">
						<CardHeader className="border-b border-border/60 pb-5">
							<CardTitle className="flex items-center gap-2 text-xl">
								<Clapperboard className="h-5 w-5 text-primary" />
								Video của bạn
							</CardTitle>
							<CardDescription>
								Chọn video để tự động tạo project mới và chuyển sang editor.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-5">
							{isVideoLoading ? (
								<WorkspaceListSkeleton rows={5} />
							) : videoError ? (
								<ErrorState
									message={toErrorMessage(videoError)}
									onRetry={() => {
										void refetchVideos();
									}}
								/>
							) : videos.length === 0 ? (
								<EmptyState
									icon={<Clapperboard className="h-10 w-10 text-muted-foreground" />}
									title="Chưa có video nào"
									description="Bạn có thể tải video lên ở trang Upload để bắt đầu." 
								/>
							) : (
								<ScrollArea className="h-[480px] pr-3">
									<div className="space-y-3">
										{videos.map((video) => {
											const isCreating = creatingFromVideoId === video.id;

											return (
												<button
													key={video.id}
													type="button"
													disabled={isCreating}
													onClick={() => {
														void handleOpenVideo(video);
													}}
													className="w-full rounded-xl border border-border/70 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
												>
													<div className="flex items-start justify-between gap-4">
														<div className="min-w-0 flex-1">
															<p className="truncate text-base font-semibold">
																Video #{video.id}
															</p>
															<p className="mt-1 text-sm text-muted-foreground">
																Loại: {video.type} • {formatDuration(video.duration)}
															</p>
														</div>
														<Badge variant="outline">image_id: {video.image_id}</Badge>
													</div>

													<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
														<span className="inline-flex items-center gap-1">
															<Calendar className="h-3.5 w-3.5" />
															{formatDate(video.updated_at || video.created_at)}
														</span>
														<span className="inline-flex items-center gap-1 font-medium text-primary">
															{isCreating ? "Đang tạo project..." : "Tạo project"}
															<ArrowRight className="h-3.5 w-3.5" />
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</ScrollArea>
							)}
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}

function WorkspaceListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className="space-y-3">
			{Array.from({ length: rows }).map((_, index) => (
				<div key={index} className="rounded-xl border border-border/70 p-4">
					<Skeleton className="mb-3 h-5 w-2/3" />
					<Skeleton className="mb-4 h-4 w-1/2" />
					<Skeleton className="h-4 w-1/3" />
				</div>
			))}
		</div>
	);
}

function EmptyState({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
			{icon}
			<h3 className="mt-4 text-lg font-semibold">{title}</h3>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
		</div>
	);
}

function ErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
			<p className="text-sm font-medium text-destructive">Không thể tải dữ liệu</p>
			<p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
			<Button className="mt-4" variant="outline" onClick={onRetry}>
				Thử lại
			</Button>
		</div>
	);
}

function getProjectStatusBadgeVariant(
	status: ProjectStatus,
): "default" | "secondary" | "destructive" | "outline" {
	if (status === "completed") return "default";
	if (status === "processing") return "secondary";
	if (status === "failed") return "destructive";
	return "outline";
}

function buildDefaultSessionName(video: Video) {
	const now = new Date();
	const dd = String(now.getDate()).padStart(2, "0");
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const hh = String(now.getHours()).padStart(2, "0");
	const min = String(now.getMinutes()).padStart(2, "0");
	return `Session video #${video.id} - ${dd}/${mm} ${hh}:${min}`;
}

function formatDuration(duration?: number) {
	if (!duration || Number.isNaN(duration)) {
		return "Không rõ thời lượng";
	}

	const totalSeconds = Math.max(0, Math.round(duration));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value?: string) {
	if (!value) {
		return "Vừa cập nhật";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Vừa cập nhật";
	}

	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function toErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}
	return "Đã xảy ra lỗi không xác định";
}

