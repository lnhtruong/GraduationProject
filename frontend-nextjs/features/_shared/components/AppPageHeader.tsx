"use client";

import type { ReactNode } from "react";

interface AppPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
}

export function AppPageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  stats,
}: AppPageHeaderProps) {
  return (
    <header className="border-b border-border/70 bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-3">
            {icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-primary">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-1 text-2xl font-semibold text-foreground md:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>

        {stats ? (
          <div className="grid gap-3 sm:grid-cols-3">{stats}</div>
        ) : null}
      </div>
    </header>
  );
}
