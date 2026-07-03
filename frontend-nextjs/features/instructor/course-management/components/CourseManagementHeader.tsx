"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface CourseManagementBreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  description: ReactNode;
  breadcrumbs: CourseManagementBreadcrumbItem[];
  leadingAction?: ReactNode;
  action?: ReactNode;
  thumbnailUrl?: string | null;
}

export function CourseManagementHeader({
  title,
  description,
  breadcrumbs,
  leadingAction,
  action,
  thumbnailUrl,
}: Props) {
  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-linear-to-br from-background/95 via-card/95 to-muted/20 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 sm:p-5 lg:p-5">
      <div className="flex items-center gap-3 w-full">
        {leadingAction && <div className="shrink-0">{leadingAction}</div>}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1 break-words">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={`${item.label}-${index}`} className="inline">
                {index > 0 && <span className="mx-1.5 opacity-60 select-none">›</span>}
                {isLast || !item.href ? (
                  <span className={cn("text-foreground/80 font-medium", isLast ? "" : "opacity-70")}>
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-foreground transition-colors duration-200 inline">
                    {item.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start flex-1 min-w-0 w-full">
          {thumbnailUrl && (
            <div className="hidden sm:block relative aspect-video w-36 shrink-0 rounded-xl overflow-hidden border border-border/50 bg-muted shadow-xs">
              <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="space-y-2 flex-1 min-w-0 w-full">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight lg:text-[1.75rem] leading-tight break-words">
                {title}
              </h1>
            </div>
            {description && <div className="text-sm text-muted-foreground w-full">{description}</div>}
          </div>
        </div>
        <div className="w-full lg:w-auto shrink-0 flex sm:justify-end justify-start">{action}</div>
      </div>
    </div>
  );
}
