import type { ReactNode } from "react";
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="mb-1.5 flex items-center gap-2">
          {icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* function ContinueWatchingCard({ item }: { item: ContinueWatchingLesson }) {
  return (
    <Link
      href={`/courses/${item.courseId}/learn?lessonId=${item.lessonId}`}
      className="group grid gap-3 rounded-lg border border-border/70 bg-card p-3 transition hover:border-primary/40 hover:shadow-md sm:grid-cols-[9rem_1fr]"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted sm:aspect-[4/3]">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.courseTitle}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 via-background to-emerald-500/10">
            <FaBookOpen className="h-8 w-8 text-primary/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="line-clamp-1 text-xs font-bold text-primary">
          {item.courseTitle}
        </p>
        <h3 className="line-clamp-2 text-sm font-black leading-snug">
          {item.lessonTitle}
        </h3>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{Math.round(item.percentage)}% hoàn thành</span>
          <span>{formatPosition(item.lastVideoPositionMs)}</span>
        </div>
        <Progress value={Math.min(100, Math.max(0, item.percentage))} />
      </div>
    </Link>
  );
} */
