"use client";

import { useCallback, useEffect, useRef } from "react";
import { useNewsfeedRecordViewMutation } from "../api/newsfeed.hooks";

import {
  NEWSFEED_INITIAL_PAGE_LIMIT,
  NEWSFEED_PREFETCH_REMAINING_THRESHOLD,
  NEWSFEED_MIN_VIEW_SECONDS,
  NEWSFEED_COMPLETION_RATIO,
} from "../constants";

export function shouldPrefetchNewsfeedPage(params: {
	remainingItems: number;
	hasMore: boolean;
	isFetchingNextPage: boolean;
}): boolean {
	return params.hasMore && !params.isFetchingNextPage && params.remainingItems <= NEWSFEED_PREFETCH_REMAINING_THRESHOLD;
}

function buildViewPayload(currentTime: number, duration: number) {
	const watchDuration = Math.max(0, Math.floor(currentTime));
	const completed = duration > 0 ? currentTime / duration >= NEWSFEED_COMPLETION_RATIO : false;

	return { watchDuration, completed };
}

export function useNewsfeedViewTracker(params: {
	feedId: number | null;
	isActive: boolean;
	videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
	const recordViewMutation = useNewsfeedRecordViewMutation();
	const didRecordRef = useRef(false);

	useEffect(() => {
		didRecordRef.current = false;
	}, [params.feedId]);

	useEffect(() => {
		if (params.isActive) {
			didRecordRef.current = false;
		}
	}, [params.isActive]);

	const flushView = useCallback(async () => {
		const video = params.videoRef.current;
		if (!video || !params.feedId || didRecordRef.current) {
			return;
		}

		const { watchDuration, completed } = buildViewPayload(
			video.currentTime || 0,
			video.duration || 0,
		);
		if (watchDuration < NEWSFEED_MIN_VIEW_SECONDS) {
			return;
		}

		didRecordRef.current = true;
		await recordViewMutation.mutateAsync({
			feedId: params.feedId,
			watchDuration,
			completed,
		});
	}, [params.feedId, params.videoRef, recordViewMutation]);

	useEffect(() => {
		if (params.isActive) {
			return;
		}

		void flushView();
	}, [flushView, params.isActive]);

	useEffect(() => {
		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				void flushView();
			}
		};

		window.addEventListener("pagehide", flushView);
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			window.removeEventListener("pagehide", flushView);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			void flushView();
		};
	}, [flushView]);

	return {
		flushView,
	};
}