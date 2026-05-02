"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "./newsfeed-ui";

interface NewsfeedSidebarProps {
  isExpanded: boolean;
  onClose: () => void;
}

export function NewsfeedSidebar({ isExpanded, onClose }: NewsfeedSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed top-16 z-30 h-[calc(100vh-64px)] border-r border-border/70 bg-background/95 backdrop-blur transition-all duration-300",
        "hidden md:flex",
        isExpanded
          ? "translate-x-0 w-60"
          : "-translate-x-full md:-translate-x-full lg:translate-x-0 lg:w-16",
      )}
    >
      <div className="flex h-full w-full flex-col items-stretch gap-3 px-2 py-3">
        <div className="flex items-center justify-between gap-2 px-1 lg:hidden">
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Menu
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-border/70 bg-background/90 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col items-stretch justify-start gap-2 overflow-y-auto pb-2">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "group flex h-11 items-center rounded-xl border border-transparent px-3 text-sm font-medium text-foreground/85 transition-colors hover:border-border/70 hover:bg-accent hover:text-foreground",
                  isExpanded ? "gap-3 justify-start" : "justify-center px-0",
                )}
              >
                <Icon className="h-5 w-5 flex-none" />
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

        <div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <p className={cn("px-1", !isExpanded && "lg:hidden")}>Lướt video, xem khóa học, lưu lại nội dung bạn thích.</p>
        </div>
      </div>
    </aside>
  );
}
