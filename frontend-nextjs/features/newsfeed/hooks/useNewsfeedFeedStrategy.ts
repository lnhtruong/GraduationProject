"use client";

import { useCallback, useEffect, useRef } from "react";
import { useNewsfeedRecordViewMutation } from "../api/newsfeed.hooks";

export const NEWSFEED_INITIAL_PAGE_LIMIT = 8;
export const NEWSFEED_PREFETCH_REMAINING_THRESHOLD = 2;
export const NEWSFEED_MIN_VIEW_SECONDS = 1;
export const NEWSFEED_COMPLETION_RATIO = 0.9;

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
	currentTime: number;
	duration: number;
}) {
	const recordViewMutation = useNewsfeedRecordViewMutation();
	const didRecordRef = useRef(false);
	const latestSnapshotRef = useRef({ currentTime: 0, duration: 0 });

	useEffect(() => {
		didRecordRef.current = false;
		latestSnapshotRef.current = { currentTime: 0, duration: 0 };
	}, [params.feedId]);

	useEffect(() => {
		if (params.isActive) {
			didRecordRef.current = false;
		}
	}, [params.isActive]);

	useEffect(() => {
		latestSnapshotRef.current = {
			currentTime: params.currentTime,
			duration: params.duration,
		};
	}, [params.currentTime, params.duration]);

	const flushView = useCallback(async () => {
		if (!params.feedId || didRecordRef.current) {
			return;
		}

		const { watchDuration, completed } = buildViewPayload(
			latestSnapshotRef.current.currentTime,
			latestSnapshotRef.current.duration,
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
	}, [params.feedId, recordViewMutation]);

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