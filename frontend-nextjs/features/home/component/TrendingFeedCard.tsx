import Image from "next/image";
import Link from "next/link";

import type { NewsfeedItem } from "@/features/newsfeed/types";
function lecturerName(item: NewsfeedItem) {
  const fullName = [item.lecturer?.lastName, item.lecturer?.firstName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "Giảng viên";
}


export function TrendingFeedCard({
  item,
  variant = "feature",
}: {
  item: NewsfeedItem;
  variant?: "feature" | "compact";
}) {
  if (variant === "compact") {
    return (
      <Link
        href={`/newsfeed?feedId=${item.feedId}`}
        className="group flex gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition hover:border-primary/40 hover:shadow-sm"
      >
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="112px"
            />
          ) : (
            <video
              src={item.videoUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          )}
        </div>
        <div className="min-w-0 py-1">
          <h3 className="line-clamp-2 text-sm font-black leading-snug">
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            {lecturerName(item)} · {item.course.name}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/newsfeed?feedId=${item.feedId}`}
      className="group overflow-hidden rounded-xl border border-border/70 bg-card transition hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 640px"
          />
        ) : (
          <video
            src={item.videoUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-xl font-black leading-tight">
          {item.title}
        </h3>
        <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">
          {lecturerName(item)} · {item.course.name}
        </p>
      </div>
    </Link>
  );
}
