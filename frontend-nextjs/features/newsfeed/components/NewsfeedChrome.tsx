"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { NewsfeedHeader } from "./NewsfeedHeader";
import { NewsfeedSidebar } from "./NewsfeedSidebar";
import { getInitials } from "./newsfeed-ui";
import { useNewsfeedUiStore } from "../store/newsfeed-ui.store";

interface NewsfeedChromeProps {
	children: ReactNode;
}

export function NewsfeedChrome({ children }: NewsfeedChromeProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, isAuthenticated, logout } = useAuth();
	const { isMenuOpen, closeMenu, toggleMenu } = useNewsfeedUiStore();
	const initialSearchValue = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
	const [searchValue, setSearchValue] = useState(initialSearchValue);

	useEffect(() => {
		setSearchValue(initialSearchValue);
	}, [initialSearchValue, pathname]);

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

	const userName = user?.firstName ?? user?.email ?? null;
	const userInitials = getInitials(user?.firstName ?? user?.email ?? "U");

	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-background to-muted/30 text-foreground dark:from-primary/10 dark:via-background dark:to-background">
			<NewsfeedHeader
				onToggleMenu={toggleMenu}
				isAuthenticated={isAuthenticated}
				userInitials={userInitials}
				userName={userName}
				onLogout={() => {
					void logout();
					router.push("/signin");
				}}
				searchValue={searchValue}
				onSearchValueChange={setSearchValue}
				onSearchSubmit={handleSearchSubmit}
			/>

			{/* Translucent backdrop overlay for mobile/tablet when sidebar is open */}
			<div
				className={cn(
					"fixed inset-0 z-20 bg-black/40 backdrop-blur-xs transition-all duration-300 lg:hidden cursor-pointer",
					isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
				)}
				onClick={closeMenu}
			/>

			<NewsfeedSidebar isExpanded={isMenuOpen} />

			<div className="relative pt-16">{children}</div>
		</div>
	);
}