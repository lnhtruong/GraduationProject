import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "../../mock-data";
import type { RecentQAItem } from "../../types";

interface Props {
  items: RecentQAItem[];
}

export function RecentQA({ items }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          Recent Q&A
          {/* TODO: badge count từ API */}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {items.filter((i) => i.needsReply).length}
          </span>
        </h2>
        <Link
          href="/instructor/qa"
          className="text-sm text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      <ul className="space-y-5">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <Avatar className="mt-0.5 h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {item.authorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{item.authorName}</span>
                {item.needsReply && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                    Needs Reply
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.courseName} · {formatRelativeTime(item.createdAt)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs italic text-foreground/80">
                &ldquo;{item.content}&rdquo;
              </p>
              <Link
                href="/instructor/qa"
                className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
              >
                → Reply
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
