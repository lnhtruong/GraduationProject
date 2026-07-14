"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewsfeedItem } from "../types";

const HISTORY_STORAGE_KEY = "studyloop.newsfeed.history.v1";
const LEGACY_HISTORY_STORAGE_KEY = "learnhub.newsfeed.history.v1";
const MAX_HISTORY_ITEMS = 60;

function readHistoryFromStorage(): NewsfeedItem[] {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const raw =
			window.localStorage.getItem(HISTORY_STORAGE_KEY) ??
			window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);
		if (!raw) {
			return [];
		}

		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter((item): item is NewsfeedItem => {
			return Boolean(item) && typeof item === "object" && typeof (item as NewsfeedItem).feedId === "number";
		});
	} catch {
		return [];
	}
}

function writeHistoryToStorage(items: NewsfeedItem[]) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
	window.localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
}

export function useNewsfeedHistory() {
	const [items, setItems] = useState<NewsfeedItem[]>(() => readHistoryFromStorage());

	useEffect(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== HISTORY_STORAGE_KEY && event.key !== LEGACY_HISTORY_STORAGE_KEY) {
				return;
			}
			setItems(readHistoryFromStorage());
		};

		window.addEventListener("storage", handleStorage);
		return () => {
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	const recordHistoryItem = useCallback((video: NewsfeedItem) => {
		setItems((current) => {
			const nextItems = [
				video,
				...current.filter((item) => item.feedId !== video.feedId),
			].slice(0, MAX_HISTORY_ITEMS);
			writeHistoryToStorage(nextItems);
			return nextItems;
		});
	}, []);

	const clearHistory = useCallback(() => {
		setItems([]);
		if (typeof window !== "undefined") {
			window.localStorage.removeItem(HISTORY_STORAGE_KEY);
			window.localStorage.removeItem(LEGACY_HISTORY_STORAGE_KEY);
		}
	}, []);

	return {
		items,
		recordHistoryItem,
		clearHistory,
	};
}
