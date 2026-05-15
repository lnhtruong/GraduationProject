"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";

function formatNumber(value: number) {
	return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function stripHtml(input?: string) {
	if (!input) {
		return "";
	}

	return input
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
		.replace(/\son\w+=(["'][^"']*["'])/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function formatDateLabel(value?: string) {
	if (!value) {
		return "--";
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(parsed);
}

function getAuthorName(video: NewsfeedItem) {
	return [video.lecturer?.firstName, video.lecturer?.lastName].filter(Boolean).join(" ").trim() || video.course.name;
}

function getAuthorInitials(name: string) {
	const parts = name.trim().split(" ").filter(Boolean);
	if (parts.length === 0) {
		return "KH";
	}
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return `${parts[0][0] ?? "K"}${parts[parts.length - 1][0] ?? "H"}`.toUpperCase();
}

function buildFeedHref(video: NewsfeedItem) {
	return `/newsfeed?videoId=${video.feedId}`;
}

interface NewsfeedVideoGridProps {
	videos: NewsfeedItem[];
	emptyTitle: string;
	emptyDescription: string;
	badgeLabel?: string;
	className?: string;
}

export function NewsfeedVideoGrid({ videos, emptyTitle, emptyDescription, badgeLabel, className }: NewsfeedVideoGridProps) {
	if (videos.length === 0) {
		return (
			<div className={cn("flex min-h-[50vh] items-center justify-center px-4", className)}>
				<div className="max-w-xl rounded-3xl border border-border/70 bg-background/85 p-8 text-center shadow-xl backdrop-blur">
					<p className="text-xl font-semibold">{emptyTitle}</p>
					<p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 lg:px-6", className)}>
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<p className="text-xl font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						{badgeLabel ?? "Danh sách video"}
					</p>
					<p className="mt-1 text-md font-semibold text-foreground">{formatNumber(videos.length)} video</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
				{videos.map((video) => {
					const authorName = getAuthorName(video);
					const href = buildFeedHref(video);
					const descriptionText = stripHtml(video.description);
					const authorInitials = getAuthorInitials(authorName);

					return (
						<Link
							key={video.feedId}
							href={href}
							className="group overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
						>
							<div className="relative aspect-[2/3] overflow-hidden bg-muted">
								{video.thumbnail ? (
									<img
										src={video.thumbnail}
										alt={video.title}
										className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								) : (
									<div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-muted/70" />
								)}

								<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

								<div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 text-white">
									<div className="min-w-0 flex-1">
										<p className="line-clamp-2 text-sm font-semibold leading-5 drop-shadow-sm">{video.title}</p>
									</div>
									<div className="flex shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
										<Heart className="h-3.5 w-3.5 fill-white" />
										<span>{formatNumber(video.stats.likes)}</span>
									</div>
								</div>
							</div>

							<div className="space-y-1.5 p-3">
								<p className="line-clamp-1 text-sm font-medium leading-5 text-foreground">
									{descriptionText || video.title}
								</p>
								<div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
									<div className="flex min-w-0 items-center gap-2">
										<Avatar className="h-5 w-5 shrink-0">
											<AvatarImage src={undefined} alt={authorName} />
											<AvatarFallback className="text-[9px] font-semibold">
												{authorInitials}
											</AvatarFallback>
										</Avatar>
										<span className="truncate text-[11px] font-medium text-foreground/85">{authorName}</span>
									</div>
									<span className="shrink-0 text-[11px] font-medium">
										{formatDateLabel(video.course.created_at)}
									</span>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}