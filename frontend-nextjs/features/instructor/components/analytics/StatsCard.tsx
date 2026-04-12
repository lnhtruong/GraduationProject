import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  changePercent: number;
  icon: React.ElementType;
}

export function StatsCard({ label, value, changePercent, icon: Icon }: Props) {
  const isPositive = changePercent >= 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold",
            isPositive
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-destructive/8 text-destructive",
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {changePercent}%
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
