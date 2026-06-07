"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CourseManagementHeader,
  type CourseManagementBreadcrumbItem,
} from "./CourseManagementHeader";

interface Props {
  title: string;
  description: string;
  breadcrumbs: CourseManagementBreadcrumbItem[];
  leadingAction?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  noCard?: boolean;
}

export function ManagementPageShell({
  title,
  description,
  breadcrumbs,
  leadingAction,
  action,
  children,
  noCard = false,
}: Props) {
  return (
    <div className="space-y-5">
      <CourseManagementHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        leadingAction={leadingAction}
        action={action}
      />

      {noCard ? (
        <div className="w-full">{children}</div>
      ) : (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">{children}</CardContent>
        </Card>
      )}
    </div>
  );
}
