import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AppLoadingStateProps {
  message?: string;
  variant?: "cards" | "panel";
  count?: number;
}

export function AppLoadingState({
  message = "Đang tải dữ liệu...",
  variant = "panel",
  count = 8,
}: AppLoadingStateProps) {
  if (variant === "cards") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }).map((_, index) => (
            <Card
              key={`app-card-loading-${index}`}
              className="gap-0 overflow-hidden rounded-lg border-border/60 py-0"
            >
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardContent className="space-y-2.5 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-9 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-border/70 bg-muted/20 px-6 py-12 text-center">
      <div className="mb-5 grid w-full max-w-sm gap-3">
        <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-48" />
        <Skeleton className="mx-auto h-3 w-64 max-w-full" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
