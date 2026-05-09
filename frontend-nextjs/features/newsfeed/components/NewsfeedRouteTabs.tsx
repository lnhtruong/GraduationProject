"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROUTE_TABS = [
	{ href: "/newsfeed", label: "Top", icon: Compass },
	{ href: "/newsfeed/history", label: "Lịch sử", icon: History },
	{ href: "/newsfeed/saved", label: "Đã lưu", icon: Bookmark },
	{ href: "/newsfeed/search", label: "Tìm kiếm", icon: Search },
];

export function NewsfeedRouteTabs() {
	const pathname = usePathname();

	return (
		<div className="border-b border-border/70 bg-background/70 backdrop-blur">
			<div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 overflow-x-auto px-3 py-2 sm:px-4 lg:px-6">
				{ROUTE_TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive =
						tab.href === "/newsfeed"
							? pathname === tab.href
							: pathname === tab.href || pathname.startsWith(`${tab.href}/`);

					return (
						<Button
							key={tab.href}
							asChild
							variant="ghost"
							className={cn(
								"h-10 shrink-0 gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
								isActive
									? "border-primary/30 bg-primary/10 text-primary shadow-sm"
									: "border-transparent bg-background/70 text-muted-foreground hover:border-border/70 hover:bg-accent hover:text-foreground",
							)}
						>
							<Link href={tab.href} className="inline-flex items-center gap-2">
								<Icon className="h-4 w-4" />
								{tab.label}
							</Link>
						</Button>
					);
				})}
			</div>
		</div>
	);
}