"use client";

import { useMemo } from "react";
import { useNewsfeedInput } from "./useNewsfeedInput";
import { useNewsfeedUi } from "./useNewsfeedUi";
import { useNewsfeedVideoFeed } from "./useNewsfeedVideoFeed";

export function useNewsfeed() {
	const feed = useNewsfeedVideoFeed(true);
	const ui = useNewsfeedUi();

	const input = useNewsfeedInput({
		enabled: feed.totalVideos > 0,
		onNext: feed.goNext,
		onPrev: feed.goPrev,
		onInteract: ui.wakeHud,
	});

	return useMemo(
		() => ({
			...feed,
			...ui,
			...input,
		}),
		[feed, ui, input],
	);
}
