"use client";

import Link from "next/link";
import type { ReactNode } from "react";

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
      <div className="flex w-full items-center gap-3">
        {leadingAction && <div className="shrink-0">{leadingAction}</div>}
        <nav
          aria-label="Breadcrumb"
          className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm"
        >
          <ol className="flex min-w-0 flex-wrap items-center gap-y-1">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li
                  key={`${item.label}-${index}`}
                  className="inline-flex min-w-0 items-center"
                >
                  {index > 0 && (
                    <span className="mx-1.5 shrink-0 select-none opacity-60">
                      ›
                    </span>
                  )}
                  {isLast || !item.href ? (
                    <span className="max-w-[12rem] truncate font-medium text-foreground/80 sm:max-w-none">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="max-w-[10rem] truncate transition-colors duration-200 hover:text-foreground sm:max-w-none"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row">
          {thumbnailUrl && (
            <div className="relative hidden aspect-video w-36 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted shadow-xs sm:block">
              <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="break-words text-xl font-bold leading-tight tracking-tight sm:text-2xl lg:text-[1.75rem]">
              {title}
            </h1>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
        </div>
        {action && (
          <div className="flex w-full shrink-0 justify-start sm:justify-end lg:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
