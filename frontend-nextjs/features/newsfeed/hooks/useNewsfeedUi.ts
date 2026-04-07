"use client";

import { useCallback, useRef, useState } from "react";

export function useNewsfeedUi() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isCoursePanelOpen, setIsCoursePanelOpen] = useState(false);
	const [isHudVisible, setIsHudVisible] = useState(true);
	const hideHudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const wakeHud = useCallback(() => {
		setIsHudVisible(true);
		if (hideHudTimer.current) {
			clearTimeout(hideHudTimer.current);
		}
		hideHudTimer.current = setTimeout(() => {
			setIsHudVisible(false);
		}, 2200);
	}, []);

	const openMenu = useCallback(() => setIsMenuOpen(true), []);
	const closeMenu = useCallback(() => setIsMenuOpen(false), []);
	const toggleMenu = useCallback(() => {
		setIsMenuOpen((current) => !current);
	}, []);

	const openCoursePanel = useCallback(() => setIsCoursePanelOpen(true), []);
	const closeCoursePanel = useCallback(() => setIsCoursePanelOpen(false), []);
	const toggleCoursePanel = useCallback(() => {
		setIsCoursePanelOpen((current) => !current);
	}, []);

	return {
		isMenuOpen,
		isCoursePanelOpen,
		isHudVisible,
		wakeHud,
		openMenu,
		closeMenu,
		toggleMenu,
		openCoursePanel,
		closeCoursePanel,
		toggleCoursePanel,
	};
}
