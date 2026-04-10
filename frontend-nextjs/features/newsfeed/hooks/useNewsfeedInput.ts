"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseNewsfeedInputOptions {
	enabled: boolean;
	onNext: () => void;
	onPrev: () => void;
	onInteract: () => void;
}

export function useNewsfeedInput({
	enabled,
	onNext,
	onPrev,
	onInteract,
}: UseNewsfeedInputOptions) {
	const wheelCooldownRef = useRef(0);
	const touchStartYRef = useRef<number | null>(null);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (["ArrowDown", "PageDown"].includes(event.key)) {
				event.preventDefault();
				onInteract();
				onNext();
				return;
			}

			if (["ArrowUp", "PageUp"].includes(event.key)) {
				event.preventDefault();
				onInteract();
				onPrev();
			}
		};

		window.addEventListener("keydown", onKeyDown, { passive: false });
		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [enabled, onInteract, onNext, onPrev]);

	const onWheelCapture = useCallback(
		(event: React.WheelEvent) => {
			if (!enabled) {
				return;
			}

			onInteract();
			const now = Date.now();
			if (now - wheelCooldownRef.current < 520) {
				return;
			}

			wheelCooldownRef.current = now;
			if (event.deltaY > 0) {
				onNext();
			} else if (event.deltaY < 0) {
				onPrev();
			}
		},
		[enabled, onInteract, onNext, onPrev],
	);

	const onTouchStart = useCallback((event: React.TouchEvent) => {
		touchStartYRef.current = event.touches[0]?.clientY ?? null;
		onInteract();
	}, [onInteract]);

	const onTouchEnd = useCallback(
		(event: React.TouchEvent) => {
			if (!enabled) {
				return;
			}

			const touchStartY = touchStartYRef.current;
			const touchEndY = event.changedTouches[0]?.clientY;
			if (touchStartY === null || touchEndY === undefined) {
				return;
			}

			const deltaY = touchStartY - touchEndY;
			if (Math.abs(deltaY) < 36) {
				return;
			}

			onInteract();
			if (deltaY > 0) {
				onNext();
			} else {
				onPrev();
			}
		},
		[enabled, onInteract, onNext, onPrev],
	);

	return {
		onWheelCapture,
		onTouchStart,
		onTouchEnd,
	};
}
