"use client";

import { useCallback, useEffect, useRef } from "react";
import { useNewsfeedRecordViewMutation } from "../api/newsfeed.hooks";

import {
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
	const watchDuration = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
	const completed =
		Number.isFinite(duration) && duration > 0
			? watchDuration / duration >= NEWSFEED_COMPLETION_RATIO
			: false;

	return { watchDuration, completed };
}

export function useNewsfeedViewTracker(params: {
	feedId: number | null;
	isActive: boolean;
	enabled: boolean;
	videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
	const recordViewMutation = useNewsfeedRecordViewMutation();
	const didRecordRef = useRef(false);
	const isRecordingRef = useRef(false);

	useEffect(() => {
		didRecordRef.current = false;
	}, [params.feedId]);

	useEffect(() => {
		if (params.isActive) {
			didRecordRef.current = false;
		}
	}, [params.isActive]);

	const flushView = useCallback(async (completedOverride = false) => {
		const video = params.videoRef.current;
		if (!params.enabled || !video || !params.feedId || didRecordRef.current || isRecordingRef.current) {
			return;
		}

		const payload = buildViewPayload(
			video.currentTime || 0,
			video.duration || 0,
		);
		const watchDuration = payload.watchDuration;
		const completed = completedOverride || payload.completed;
		if (!completed && watchDuration < NEWSFEED_MIN_VIEW_SECONDS) {
			return;
		}

		isRecordingRef.current = true;
		try {
			await recordViewMutation.mutateAsync({
				feedId: params.feedId,
				watchDuration,
				completed,
			});
			didRecordRef.current = true;
		} catch (error) {
			console.error("Record newsfeed view failed:", error);
		} finally {
			isRecordingRef.current = false;
		}
	}, [params.enabled, params.feedId, params.videoRef, recordViewMutation]);

	useEffect(() => {
		if (params.isActive) {
			return;
		}

		void flushView();
	}, [flushView, params.isActive]);

	useEffect(() => {
		const video = params.videoRef.current;
		if (!params.isActive || !video) {
			return;
		}

		const flushWhenCompleted = () => {
			const { completed } = buildViewPayload(video.currentTime || 0, video.duration || 0);
			if (completed || video.ended) {
				void flushView(video.ended);
			}
		};

		video.addEventListener("ended", flushWhenCompleted);
		video.addEventListener("timeupdate", flushWhenCompleted);

		return () => {
			video.removeEventListener("ended", flushWhenCompleted);
			video.removeEventListener("timeupdate", flushWhenCompleted);
		};
	}, [flushView, params.isActive, params.videoRef]);

	useEffect(() => {
		const onPageHide = () => {
			void flushView();
		};
		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				void flushView();
			}
		};

		window.addEventListener("pagehide", onPageHide);
		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			window.removeEventListener("pagehide", onPageHide);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			void flushView();
		};
	}, [flushView]);

	return {
		flushView,
	};
}
