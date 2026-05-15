"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowRight,
	BookOpen,
	CheckCircle,
	ChevronRight,
	Clock,
	Globe,
	GraduationCap,
	ShoppingCart,
	Sparkles,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAddToCart, useIsInCart } from "@/features/cart/api/cart.hooks";
import { useBuyNow } from "@/features/payment/api/payment.hooks";
import { useEnrollmentCheck } from "@/features/courses/api/enrollment.api";
import { useAuthStore } from "@/store/auth";
import { useRoadmapsPaginated } from "@/features/roadmap/api/roadmap.hooks";
import type { Roadmap, RoadmapCourse } from "@/features/roadmap/types";
import type { NewsfeedItem } from "../types";

const LEVEL_LABELS: Record<string, string> = {
	Beginner: "Sơ cấp",
	Intermediate: "Trung cấp",
	Advanced: "Cao cấp",
};

const LEVEL_META: Record<
	string,
	{ label: string; icon: typeof BookOpen }
> = {
	Beginner: { label: LEVEL_LABELS.Beginner, icon: BookOpen },
	Intermediate: { label: LEVEL_LABELS.Intermediate, icon: GraduationCap },
	Advanced: { label: LEVEL_LABELS.Advanced, icon: Sparkles },
};

function formatCoursePrice(price: number) {
	return price > 0 ? `${price.toLocaleString("vi-VN")} VND` : "Miễn phí";
}

function formatDurationLabel(duration?: string | null) {
	if (!duration) {
		return "--";
	}

	const normalized = duration.trim();
	const timeMatch = normalized.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
	if (timeMatch) {
		const hours = Number(timeMatch[1] ?? 0);
		const minutes = Number(timeMatch[2] ?? 0);
		const seconds = Number(timeMatch[3] ?? 0);
		const totalMinutes = hours * 60 + minutes;
		return `${totalMinutes}p${String(seconds).padStart(2, "0")}s`;
	}

	const minutesMatch = normalized.match(/^(\d+)\s*(?:phút|phut|p|m)(?:\s*(\d+)\s*(?:giây|giay|s))?$/i);
	if (minutesMatch) {
		const minutes = Number(minutesMatch[1] ?? 0);
		const seconds = Number(minutesMatch[2] ?? 0);
		return `${minutes}p${String(seconds).padStart(2, "0")}s`;
	}

	const secondsOnly = Number(normalized);
	if (Number.isFinite(secondsOnly) && secondsOnly >= 0) {
		const minutes = Math.floor(secondsOnly / 60);
		const seconds = Math.floor(secondsOnly % 60);
		return `${minutes}p${String(seconds).padStart(2, "0")}s`;
	}

	return normalized;
}

function sortRoadmapCourses(courses: RoadmapCourse[]) {
	return [...courses].sort((left, right) => {
		const orderDelta = (left.orderIndex ?? 0) - (right.orderIndex ?? 0);
		if (orderDelta !== 0) {
			return orderDelta;
		}

		return left.id - right.id;
	});
}

function getRoadmapList(data: unknown): Roadmap[] {
	if (Array.isArray(data)) {
		return data as Roadmap[];
	}

	if (data && typeof data === "object" && "data" in data) {
		const maybeData = data as { data?: Roadmap[] };
		return Array.isArray(maybeData.data) ? maybeData.data : [];
	}

	return [];
}


function RoadmapLaneItem({
	course,
	index,
	total,
	isCurrent,
	isCompleted,
}: {
	course: NonNullable<RoadmapCourse["course"]>;
	index: number;
	total: number;
	isCurrent: boolean;
	isCompleted: boolean;
}) {
	const href = `/courses/${course.id}`;

	return (
		<Link
			href={href}
			className={cn(
				"group block px-1 py-2 transition-colors duration-200",
				isCurrent ? "text-foreground" : "text-muted-foreground hover:text-foreground",
			)}
		>
			<div className="flex items-start gap-3">
				<div className="flex flex-col items-center pt-0.5">
					<div
						className={cn(
							"flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
							isCurrent
								? "border-primary bg-primary text-primary-foreground"
								: isCompleted
									? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
									: "border-border/70 bg-background text-muted-foreground",
						)}
					>
						{index + 1}
					</div>
					{index < total - 1 ? (
						<div className={cn("mt-2 h-8 w-px rounded-full", isCompleted ? "bg-emerald-500/35" : "bg-border/70")} />
					) : null}
				</div>

				<div className="min-w-0 flex-1 pb-1">
					<p className={cn("text-sm font-semibold leading-6", isCurrent ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
						{course.name}
					</p>
					<p className="mt-0.5 text-xs leading-5 text-muted-foreground">
						{course.level} • {formatDurationLabel(course.duration)} • {course.language === "vi" ? "Tiếng Việt" : course.language === "en" ? "Tiếng Anh" : course.language}
					</p>
					<div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
						<span>{course.price > 0 ? `${course.price.toLocaleString("vi-VN")} VND` : "Miễn phí"}</span>
						<span>•</span>
						<span className={cn("font-medium", isCurrent ? "text-primary" : isCompleted ? "text-emerald-600" : "text-muted-foreground")}>
							{isCurrent ? "Đang học" : isCompleted ? "Đã học" : `Bài ${String(index + 1).padStart(2, "0")}`}
						</span>
						<ArrowRight className="h-3 w-3" />
					</div>
				</div>
			</div>
		</Link>
	);
}

interface NewsfeedCoursePanelProps {
	video: NewsfeedItem;
	onClose?: () => void;
}

export function NewsfeedCoursePanel({ video, onClose }: NewsfeedCoursePanelProps) {
	const router = useRouter();
	const { user } = useAuthStore();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
	const courseId = video.course.id;

	const addToCart = useAddToCart();
	const buyNow = useBuyNow(courseId);
	const isInCart = useIsInCart(courseId);
	const { data: enrollment } = useEnrollmentCheck(courseId, user?.id);
	const isEnrolled = enrollment != null;

	const roadmapQuery = useRoadmapsPaginated(
		{ userId: video.course.userId, page: 1, limit: 50 },
		Boolean(video.course.userId),
	);

	const roadmaps = useMemo(() => getRoadmapList(roadmapQuery.data), [roadmapQuery.data]);

	const activeRoadmap = useMemo(() => {
		if (!roadmaps.length) {
			return null;
		}

		const matchedRoadmap = roadmaps.find((roadmap) =>
			(roadmap.roadmapCourses ?? []).some(
				(course) => course.courseId === video.course.id,
			),
		);

		return matchedRoadmap ?? roadmaps[0] ?? null;
	}, [roadmaps, video.course.id]);

	const roadmapCourses = useMemo(() => {
		if (!activeRoadmap?.roadmapCourses?.length) {
			return [];
		}

		return sortRoadmapCourses(activeRoadmap.roadmapCourses).filter((course) => Boolean(course.course));
	}, [activeRoadmap]);

	const activeCourseIndex = useMemo(
		() => roadmapCourses.findIndex((course) => course.courseId === video.course.id),
		[roadmapCourses, video.course.id],
	);

	const currentStepLabel =
		activeCourseIndex >= 0
			? `${activeCourseIndex + 1}/${roadmapCourses.length}`
			: roadmapCourses.length
				? `--/${roadmapCourses.length}`
				: "0/0";
	const languageLabel = video.course.language === "vi" ? "Tiếng Việt" : video.course.language === "en" ? "Tiếng Anh" : video.course.language;
	const levelMeta = LEVEL_META[video.course.level] ?? {
		label: LEVEL_LABELS[video.course.level] ?? video.course.level,
		icon: Sparkles,
	};

	const handleAddToCart = () => {
		if (!isAuthenticated) {
			router.push(`/signin?returnUrl=/courses/${courseId}`);
			return;
		}
		addToCart.mutate(courseId, {
			onSuccess: () => toast.success("Đã thêm vào giỏ hàng!"),
			onError: () => toast.error("Không thể thêm vào giỏ. Vui lòng thử lại."),
		});
	};

	const handleBuyNow = () => {
		if (!isAuthenticated) {
			router.push(`/signin?returnUrl=/courses/${courseId}`);
			return;
		}
		buyNow.mutate(undefined, {
			onError: () => toast.error("Không thể xử lý yêu cầu. Vui lòng thử lại."),
		});
	};

	return (
		<div className="flex h-full min-h-0 flex-col overflow-y-auto pr-1">
			<section className="relative border-b border-border bg-card px-4 py-5 text-foreground sm:px-5">
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
				<div className="relative space-y-4">
					<div className="flex items-start justify-between gap-3">
						<div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
							Thông tin khóa học
						</div>
						{onClose ? (
							<Button
								variant="ghost"
								size="icon"
								onClick={onClose}
								className="h-9 w-9 rounded-none border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
							>
								<ChevronRight className="h-5 w-5" />
							</Button>
						) : null}
					</div>

					<div>
						<h3 className="text-2xl font-bold leading-tight sm:text-[2rem]">
							{video.course.name}
						</h3>
						<div
							className="mt-3 max-w-none text-sm leading-7 text-muted-foreground"
							dangerouslySetInnerHTML={{ __html: video.course.description }}
						/>
					</div>

					<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
						<span className="inline-flex items-center gap-1.5">
							<Globe className="h-4 w-4 text-primary" />
							{languageLabel}
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Clock className="h-4 w-4 text-primary" />
							{formatDurationLabel(video.course.duration)}
						</span>
						<span className="inline-flex items-center gap-1.5">
							<Users className="h-4 w-4 text-primary" />
							ID khóa học {video.course.id}
						</span>
						<span className="inline-flex items-center gap-1.5 text-foreground">
							<levelMeta.icon className="h-4 w-4 text-primary" />
							{levelMeta.label}
						</span>
					</div>

					<div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
						{video.course.categories.slice(0, 6).map((tag) => (
							<span key={tag} className="text-primary">
								#{tag}
							</span>
						))}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
						<p className="text-lg font-semibold text-primary">{formatCoursePrice(video.course.price)}</p>

						{/* Đã enrolled */}
						{isEnrolled ? (
							<Button
								type="button"
								className="h-10 w-full rounded-none border border-green-500/40 bg-green-500/10 px-5 text-green-600 hover:bg-green-500/20 dark:text-green-400"
								asChild
							>
								<Link href={`/courses/${courseId}/learn`}>
									<CheckCircle className="mr-2 h-4 w-4" />
									Vào học ngay
								</Link>
							</Button>
						) : video.course.price === 0 ? (
							/* Khoá miễn phí chưa enrolled */
							<Button
								type="button"
								className="h-10 w-full rounded-none px-5"
								onClick={handleBuyNow}
								disabled={buyNow.isPending}
							>
								{buyNow.isPending ? "Đang đăng ký..." : "Đăng ký miễn phí"}
							</Button>
						) : (
							/* Khoá có phí chưa enrolled */
							<div className="grid w-full gap-2 sm:grid-cols-2">
								{isInCart ? (
									<Button
										type="button"
										variant="outline"
										className="h-10 rounded-none border-green-500/40 bg-green-500/8 px-5 text-green-600 hover:bg-green-500/15 dark:text-green-400"
										asChild
									>
										<Link href="/cart">
											<ShoppingCart className="mr-2 h-4 w-4" />
											Đã có trong giỏ
										</Link>
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										onClick={handleAddToCart}
										disabled={addToCart.isPending}
										className="h-10 rounded-none border-border bg-background px-5 text-foreground hover:bg-accent hover:text-accent-foreground"
									>
										<ShoppingCart className="mr-2 h-4 w-4" />
										{addToCart.isPending ? "Đang thêm..." : "Thêm giỏ hàng"}
									</Button>
								)}
								<Button
									type="button"
									onClick={handleBuyNow}
									disabled={buyNow.isPending}
									className="h-10 rounded-none px-5"
								>
									{buyNow.isPending ? "Đang xử lý..." : "Mua ngay"}
								</Button>
							</div>
						)}
					</div>
					<div className="flex justify-end pt-1">
						<Link
							href={`/courses/${video.course.id}`}
							className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline hover:text-primary/80"
						>
							Xem chi tiết khóa học
							<ArrowRight className="h-4 w-4" />
						</Link>
					</div>
				</div>
			</section>

			<section className="flex-1 bg-muted/30 px-4 py-5 text-foreground sm:px-5">
				<div className="space-y-4">
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
								Lộ trình học
							</div>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								Học theo tuyến dọc, bài trước dẫn bài sau, không rẽ nhánh.
							</p>
						</div>
						<div className="text-right text-xs text-muted-foreground">
							<p>{currentStepLabel}</p>
							<p className="mt-1">{activeRoadmap?.name ?? "Chưa có lộ trình"}</p>
						</div>
					</div>

					{roadmapQuery.isLoading ? (
						<div className="space-y-3 text-muted-foreground">
							<div className="h-4 w-1/2 animate-pulse bg-muted" />
							<div className="h-4 w-3/4 animate-pulse bg-muted" />
							<div className="h-4 w-2/3 animate-pulse bg-muted" />
						</div>
					) : roadmapCourses.length ? (
						<div className="space-y-0.5">
							{roadmapCourses.map((roadmapCourse, index) => {
								const course = roadmapCourse.course;
								const isCurrent = activeCourseIndex >= 0 && index === activeCourseIndex;
								const isCompleted = activeCourseIndex >= 0 && index < activeCourseIndex;

								if (!course) {
									return null;
								}

								return (
									<RoadmapLaneItem
										key={roadmapCourse.id}
										course={course}
										index={index}
										total={roadmapCourses.length}
										isCurrent={isCurrent}
										isCompleted={isCompleted}
									/>
								);
							})}
						</div>
					) : (
						<div className="text-sm leading-7 text-muted-foreground">
							Chưa tìm thấy roadmap phù hợp cho khóa học này.
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
