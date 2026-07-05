"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useNewsfeedFeed, useNewsfeedSavedFeeds, useNewsfeedViewedFeeds } from "../api/newsfeed.hooks";
import type { NewsfeedItem } from "../types";
import { useNewsfeedHistory } from "../hooks/useNewsfeedHistory";
import { useNewsfeedUiStore } from "../store/newsfeed-ui.store";
import { cn } from "@/lib/utils";
import { NewsfeedVideoGrid } from "./NewsfeedVideoGrid";

export type NewsfeedCollectionMode = "history" | "saved" | "search";

interface NewsfeedCollectionPageProps {
	mode: NewsfeedCollectionMode;
	searchTerm?: string;
}

function uniqueByFeedId(videos: NewsfeedItem[]) {
	return videos.filter((video, index, list) => list.findIndex((item) => item.feedId === video.feedId) === index);
}

export function NewsfeedCollectionPage({ mode, searchTerm = "" }: NewsfeedCollectionPageProps) {
	const normalizedSearchTerm = searchTerm.trim();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
	const shouldLoadFeed = mode === "search" && Boolean(normalizedSearchTerm);
	const feedQuery = useNewsfeedFeed(shouldLoadFeed, 24, normalizedSearchTerm);
	const viewedQuery = useNewsfeedViewedFeeds(mode === "history" && isAuthenticated);
	const savedQuery = useNewsfeedSavedFeeds(mode === "saved" && isAuthenticated);
	const { items: historyItems, clearHistory } = useNewsfeedHistory();
	const { isMenuOpen } = useNewsfeedUiStore();

	const feedItems = useMemo(
		() => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
		[feedQuery.data?.pages],
	);

	const viewedItems = useMemo(
		() => viewedQuery.data?.items ?? [],
		[viewedQuery.data?.items],
	);

	const savedApiItems = useMemo(
		() => savedQuery.data?.items ?? [],
		[savedQuery.data?.items],
	);

	const displayItems = useMemo(() => {
		if (mode === "history") {
			return uniqueByFeedId(isAuthenticated && viewedItems.length ? viewedItems : historyItems);
		}

		if (mode === "saved") {
			return uniqueByFeedId(savedApiItems);
		}

		return uniqueByFeedId(feedItems);
	}, [feedItems, historyItems, isAuthenticated, mode, savedApiItems, viewedItems]);

	const pageTitle = useMemo(() => {
		switch (mode) {
			case "history":
				return "VIDEO ĐÃ XEM";
			case "saved":
				return "VIDEO ĐÃ LƯU";
			case "search":
			default:
				return normalizedSearchTerm ? `TÌM KIẾM: ${normalizedSearchTerm}` : "TÌM KIẾM...";
		}
	}, [mode, normalizedSearchTerm]);

	const isLoading =
		(shouldLoadFeed && feedQuery.isLoading) ||
		(mode === "history" && isAuthenticated && viewedQuery.isLoading) ||
		(mode === "saved" && isAuthenticated && savedQuery.isLoading);

	const needsLoginForSaved = mode === "saved" && !isAuthenticated;

	return (
		<div className={cn("min-h-[calc(100vh-64px)] pb-8", isMenuOpen ? "lg:pl-60" : "lg:pl-16") }>
			{needsLoginForSaved ? (
				<div className="flex min-h-[50vh] items-center justify-center px-4">
					<div className="max-w-xl rounded-3xl border border-border/70 bg-background/85 p-8 text-center shadow-xl backdrop-blur">
						<p className="text-xl font-semibold">VIDEO ĐÃ LƯU</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Đăng nhập để xem lại các video bạn đã lưu trên LearnHub.
						</p>
						<Button asChild className="mt-5 rounded-full">
							<Link href="/signin?returnUrl=/newsfeed/saved">Đăng nhập</Link>
						</Button>
					</div>
				</div>
			) : isLoading ? (
				<div className="mx-auto w-full max-w-[1400px] px-3 pb-8 sm:px-4 lg:px-6">
					<div className="rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm">
						<PageLoader message="Đang tải video cho trang này..." className="min-h-[40vh]" />
					</div>
				</div>
			) : (
				<NewsfeedVideoGrid
					videos={displayItems}
					emptyTitle={pageTitle}
					emptyDescription={
						mode === "search"
							? normalizedSearchTerm
								? `Không có kết quả cho “${normalizedSearchTerm}”.`
								: "Nhập từ khóa để bắt đầu tìm kiếm."
							: "Chưa có video nào để hiển thị."
					}
					badgeLabel={pageTitle}
					className="pb-8"
				/>
			)}

			{mode === "history" && viewedItems.length === 0 && historyItems.length > 0 ? (
				<div className="mx-auto w-full max-w-[1400px] px-3 pb-8 sm:px-4 lg:px-6">
					<button
						type="button"
						onClick={clearHistory}
						className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
					>
						Xóa lịch sử xem
					</button>
				</div>
			) : null}
		</div>
	);
}
