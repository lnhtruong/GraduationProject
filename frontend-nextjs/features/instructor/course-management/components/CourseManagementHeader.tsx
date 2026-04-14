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
    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-linear-to-br from-background via-card to-muted/20 p-5 shadow-sm lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        {leadingAction && <div className="shrink-0">{leadingAction}</div>}
        <Breadcrumb>
          <BreadcrumbList>
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
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
