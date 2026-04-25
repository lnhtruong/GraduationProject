"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
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
  description: string;
  breadcrumbs: CourseManagementBreadcrumbItem[];
  leadingAction?: ReactNode;
  action?: ReactNode;
}

export function CourseManagementHeader({
  title,
  description,
  breadcrumbs,
  leadingAction,
  action,
}: Props) {
  return (
    <div className="sticky top-16 z-40 flex flex-col gap-4 rounded-2xl border border-border/60 bg-linear-to-br from-background/95 via-card/95 to-muted/20 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 sm:p-5 lg:p-5">
      <div className="flex flex-wrap items-center gap-3">
        {leadingAction && <div className="shrink-0">{leadingAction}</div>}
        <Breadcrumb className="min-w-0 flex-1 overflow-x-auto">
          <BreadcrumbList className="w-max min-w-full flex-nowrap sm:w-auto sm:min-w-0 sm:flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/instructor/dashboard">Instructor</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${item.label}-${index}`}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-[1.75rem]">
              {title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
