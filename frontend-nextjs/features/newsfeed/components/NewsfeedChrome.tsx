"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { NewsfeedHeader } from "./NewsfeedHeader";
import { NewsfeedSidebar } from "./NewsfeedSidebar";
import { useNewsfeedUiStore } from "../store/newsfeed-ui.store";

interface NewsfeedChromeProps {
	children: ReactNode;
}

export function NewsfeedChrome({ children }: NewsfeedChromeProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, isAuthenticated, logout } = useAuth();
	const { isMenuOpen, closeMenu, toggleMenu, closeOptionBox } = useNewsfeedUiStore();
	const initialSearchValue = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
	const searchStateKey = `${pathname}:${initialSearchValue}`;
	const [searchState, setSearchState] = useState({
		key: searchStateKey,
		value: initialSearchValue,
	});

	if (searchState.key !== searchStateKey) {
		setSearchState({
			key: searchStateKey,
			value: initialSearchValue,
		});
	}

	const searchValue = searchState.key === searchStateKey ? searchState.value : initialSearchValue;
	const setSearchValue = useCallback((value: string) => {
		setSearchState(() => ({
			key: searchStateKey,
			value,
		}));
	}, [searchStateKey]);

	const handleSearchSubmit = useCallback(
		(value: string) => {
			const nextValue = value.trim();
			const href = nextValue
				? `/newsfeed/search?q=${encodeURIComponent(nextValue)}`
				: "/newsfeed/search";
			router.push(href);
		},
		[router],
	);

	const handleToggleMenu = useCallback(() => {
		closeOptionBox();
		toggleMenu();
	}, [closeOptionBox, toggleMenu]);

	const handleSidebarNavigate = useCallback(() => {
		closeMenu();
		closeOptionBox();
	}, [closeMenu, closeOptionBox]);

	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/30 text-foreground dark:from-primary/10 dark:via-background dark:to-background">
			<NewsfeedHeader
				onToggleMenu={handleToggleMenu}
				isAuthenticated={isAuthenticated}
				user={user}
				onLogout={() => {
					void logout();
					router.push("/signin");
				}}
				searchValue={searchValue}
				onSearchValueChange={setSearchValue}
				onSearchSubmit={handleSearchSubmit}
			/>

			<div
				className={cn(
					"fixed inset-0 z-20 cursor-pointer bg-black/40 backdrop-blur-xs transition-all duration-300 lg:hidden",
					isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
				)}
				onPointerDown={(event) => event.stopPropagation()}
				onClick={(event) => {
					event.stopPropagation();
					closeMenu();
				}}
			/>

			<NewsfeedSidebar isExpanded={isMenuOpen} onNavigate={handleSidebarNavigate} />

			<div className="relative pt-16">{children}</div>
		</div>
	);
}
