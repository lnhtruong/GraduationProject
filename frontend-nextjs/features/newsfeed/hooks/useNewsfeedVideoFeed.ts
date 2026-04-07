"use client";

import { useCallback, useMemo, useState } from "react";
import { useNewsfeedFeed } from "../api/newsfeed.hooks";

function wrapIndex(index: number, length: number) {
	if (!length) {
		return 0;
	}
	return ((index % length) + length) % length;
}

export function useNewsfeedVideoFeed(enabled = true) {
	const feedQuery = useNewsfeedFeed(enabled);
	const [activeIndex, setActiveIndex] = useState(0);

	const videos = feedQuery.data ?? [];
	const totalVideos = videos.length;

	const safeIndex = useMemo(
		() => wrapIndex(activeIndex, totalVideos),
		[activeIndex, totalVideos],
	);

	const activeVideo = useMemo(() => {
		if (!totalVideos) {
			return null;
		}
		return videos[safeIndex] ?? null;
	}, [safeIndex, totalVideos, videos]);

	const nextVideo = useMemo(() => {
		if (!totalVideos) {
			return null;
		}
		return videos[wrapIndex(safeIndex + 1, totalVideos)] ?? null;
	}, [safeIndex, totalVideos, videos]);

	const prevVideo = useMemo(() => {
		if (!totalVideos) {
			return null;
		}
		return videos[wrapIndex(safeIndex - 1, totalVideos)] ?? null;
	}, [safeIndex, totalVideos, videos]);

	const goNext = useCallback(() => {
		if (!totalVideos) {
			return;
		}
		setActiveIndex((current) => current + 1);
	}, [totalVideos]);

	const goPrev = useCallback(() => {
		if (!totalVideos) {
			return;
		}
		setActiveIndex((current) => current - 1);
	}, [totalVideos]);

	const jumpTo = useCallback(
		(index: number) => {
			if (!totalVideos) {
				return;
			}
			setActiveIndex(wrapIndex(index, totalVideos));
		},
		[totalVideos],
	);

	return {
		videos,
		totalVideos,
		activeIndex: safeIndex,
		activeVideo,
		nextVideo,
		prevVideo,
		isLoading: feedQuery.isLoading,
		isFetching: feedQuery.isFetching,
		error: feedQuery.error,
		refetch: feedQuery.refetch,
		goNext,
		goPrev,
		jumpTo,
	};
}
