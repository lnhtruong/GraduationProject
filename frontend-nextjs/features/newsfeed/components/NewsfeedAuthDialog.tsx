"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNewsfeedUiStore } from "../store/newsfeed-ui.store";

export type NewsfeedAuthAction = "like" | "save" | "comment";

interface NewsfeedAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: NewsfeedAuthAction;
}

const authActionContent: Record<
  NewsfeedAuthAction,
  {
    title: string;
    description: string;
    Icon: typeof Heart;
    iconClassName: string;
  }
> = {
  like: {
    title: "Đăng nhập để thả tim",
    description: "StudyLoop sẽ đưa bạn quay lại đúng video này sau khi đăng nhập.",
    Icon: Heart,
    iconClassName: "fill-primary/15 text-primary",
  },
  save: {
    title: "Đăng nhập để lưu video",
    description: "Lưu lại video hay và mở lại nhanh trong danh sách của bạn.",
    Icon: Bookmark,
    iconClassName: "fill-primary/15 text-primary",
  },
  comment: {
    title: "Đăng nhập để bình luận",
    description: "Tham gia trao đổi và tiếp tục xem đúng video này sau khi đăng nhập.",
    Icon: MessageCircle,
    iconClassName: "text-primary",
  },
};

export function NewsfeedAuthDialog({
  open,
  onOpenChange,
  action = "like",
}: NewsfeedAuthDialogProps) {
  const router = useRouter();
  const shouldResumeOnClose = useRef(false);
  const content = authActionContent[action];
  const returnUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/newsfeed";
    }

    return `${window.location.pathname}${window.location.search}`;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const { isGlobalPaused, setGlobalPaused } = useNewsfeedUiStore.getState();
    shouldResumeOnClose.current = !isGlobalPaused;
    setGlobalPaused(true);

    return () => {
      if (shouldResumeOnClose.current) {
        setGlobalPaused(false);
        shouldResumeOnClose.current = false;
      }
    };
  }, [open]);

  const handleLogin = () => {
    router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const Icon = content.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "left-0 top-auto bottom-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none border-x-0 border-b-0 bg-background p-0 text-foreground shadow-2xl",
          "data-[state=open]:slide-in-from-bottom-6 data-[state=closed]:slide-out-to-bottom-6",
          "sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-border/70 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
        )}
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/20 mt-3 sm:hidden" />
        <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-7 text-center sm:px-7 sm:py-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/10">
            <Icon className={cn("h-6 w-6", content.iconClassName)} />
          </div>

          <DialogHeader className="items-center gap-3 text-center">
            <DialogTitle className="max-w-[280px] text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {content.title}
            </DialogTitle>
            <DialogDescription className="max-w-[300px] text-center text-sm leading-6 text-muted-foreground">
              {content.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 space-y-2">
            <Button
              type="button"
              className="h-12 w-full rounded-full text-base font-semibold shadow-lg shadow-primary/20"
              onClick={handleLogin}
            >
              Đăng nhập
            </Button>

            <DialogFooter className="sm:justify-center">
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground sm:w-full"
                onClick={() => onOpenChange(false)}
              >
                Để sau
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
