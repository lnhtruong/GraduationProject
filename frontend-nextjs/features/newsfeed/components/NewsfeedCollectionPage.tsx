"use client";

import { useMemo } from "react";
import { PageLoader } from "@/components/PageLoader";
import { useNewsfeedFeed } from "../api/newsfeed.hooks";
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
	const shouldLoadFeed = mode !== "search" || Boolean(normalizedSearchTerm);
	const feedQuery = useNewsfeedFeed(shouldLoadFeed, 24, mode === "search" ? normalizedSearchTerm : "");
	const { items: historyItems, clearHistory } = useNewsfeedHistory();
	const { isMenuOpen } = useNewsfeedUiStore();

	const feedItems = useMemo(
		() => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
		[feedQuery.data?.pages],
	);

	const savedItems = useMemo(
		() => feedItems.filter((item) => item.isSaved),
		[feedItems],
	);

	const displayItems = useMemo(() => {
		if (mode === "history") {
			return historyItems.length ? historyItems : feedItems;
		}

		if (mode === "saved") {
			return savedItems.length ? savedItems : feedItems;
		}

		return uniqueByFeedId(feedItems);
	}, [feedItems, historyItems, mode, savedItems]);

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

	const isLoading = shouldLoadFeed && feedQuery.isLoading;

	return (
		<div className={cn("min-h-[calc(100vh-64px)] pb-8", isMenuOpen ? "lg:pl-60" : "lg:pl-16") }>
			{isLoading ? (
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

			{mode === "history" && historyItems.length > 0 ? (
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