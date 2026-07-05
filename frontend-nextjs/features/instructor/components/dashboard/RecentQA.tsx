import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "../../utils/format";
import type { RecentQAItem } from "../../types";

interface Props {
  items: RecentQAItem[];
}

export function RecentQA({ items }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          Hỏi đáp gần đây
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {items.filter((item) => item.needsReply).length}
          </span>
        </h2>
        <Link href="/instructor/qa" className="text-sm text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>

      <ul className="space-y-5">
        {items.map((item) => {
          const authorAvatar =
            "authorAvatar" in item && typeof item.authorAvatar === "string"
              ? item.authorAvatar
              : undefined;

          return (
            <li key={item.id} className="flex gap-3">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarImage src={authorAvatar} alt={item.authorName} />
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  {item.authorName
                    .split(" ")
                    .map((namePart) => namePart[0])
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
                      Cần phản hồi
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
                  Phản hồi
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
