import { Clapperboard } from "lucide-react";

export default function ShortsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Clapperboard className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold">Shorts Feed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tính năng này đang được phát triển và sẽ sớm ra mắt.
        </p>
      </div>
    </div>
  );
}
