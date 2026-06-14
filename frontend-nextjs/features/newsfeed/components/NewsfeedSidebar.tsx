"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "./newsfeed-ui";

interface NewsfeedSidebarProps {
  isExpanded: boolean;
}

export function NewsfeedSidebar({ isExpanded }: NewsfeedSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed top-16 z-30 h-[calc(100vh-64px)] border-r border-border/70 bg-background/95 backdrop-blur transition-all duration-300 ease-in-out flex",
        isExpanded
          ? "visible translate-x-0 w-60"
          : "invisible -translate-x-full md:invisible md:-translate-x-full lg:visible lg:translate-x-0 lg:w-16",
      )}
    >
      <div className="flex h-full w-full flex-col items-stretch gap-3 px-2 py-3">

        <nav className="flex flex-1 flex-col items-stretch justify-start gap-2 overflow-y-auto pb-2">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "top"
              ? pathname === item.href
              : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "group relative flex h-11 items-center rounded-xl border px-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border-primary/10"
                    : "border-transparent text-foreground/85 hover:border-border/70 hover:bg-accent hover:text-foreground",
                  isExpanded ? "gap-3 justify-start" : "justify-center px-0",
                )}
              >
                {isActive && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary" />
                )}
                <Icon className={cn("h-5 w-5 flex-none transition-transform duration-200", isExpanded ? "group-hover:translate-x-0.5" : "group-hover:scale-110")} />
                <span
                  className={cn(
                    "whitespace-nowrap transition-all",
                    isExpanded
                      ? "opacity-100"
                      : "w-0 overflow-hidden opacity-0 lg:w-0",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>


      </div>
    </aside>
  );
}
