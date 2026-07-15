import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface AppEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
  tone?: "default" | "destructive";
  className?: string;
}

export function AppEmptyState({
  icon,
  title,
  description,
  action,
  children,
  tone = "default",
  className,
}: AppEmptyStateProps) {
  const isDestructive = tone === "destructive";

  return (
    <Empty
      className={cn(
        "min-h-[320px] border bg-muted/20",
        isDestructive && "border-destructive/40 bg-destructive/5",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            "size-16 border border-border/70 bg-background text-muted-foreground [&_svg:not([class*='size-'])]:size-8",
            isDestructive && "border-destructive/30 text-destructive",
          )}
        >
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action || children ? (
        <EmptyContent>
          {action}
          {children}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
