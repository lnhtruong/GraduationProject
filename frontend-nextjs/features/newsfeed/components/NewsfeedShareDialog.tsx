"use client";

import { useState } from "react";
import {
  Copy,
  Link as LinkIcon,
  Mail,
  SendHorizonal,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SHARE_CHANNELS = [
  {
    id: "facebook",
    label: "Facebook",
    icon: Share2,
    buildUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: SendHorizonal,
    buildUrl: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  },
  {
    id: "x",
    label: "X",
    icon: Share2,
    buildUrl: (url: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    buildUrl: (url: string) =>
      `mailto:?subject=${encodeURIComponent("Video học trên StudyLoop")}&body=${encodeURIComponent(url)}`,
  },
];

interface NewsfeedShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  onShareRecorded?: () => void;
}

export function NewsfeedShareDialog({
  open,
  onOpenChange,
  url,
  onShareRecorded,
}: NewsfeedShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onShareRecorded?.();
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleShareChannel = (buildUrl: (url: string) => string) => {
    const targetUrl = buildUrl(url);
    onShareRecorded?.();

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/70 bg-background/95 shadow-xl">
        <DialogHeader>
          <DialogTitle>Chia sẻ video</DialogTitle>
          <DialogDescription>
            Chọn kênh chia sẻ hoặc sao chép đường dẫn.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHARE_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => handleShareChannel(channel.buildUrl)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-muted/40 px-3 py-3 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
              >
                <Icon className="h-5 w-5" />
                {channel.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border/60 p-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            readOnly
            value={url}
            className="border-0 bg-transparent text-sm focus-visible:ring-0"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleCopy()}
            className={cn("shrink-0", copied && "bg-primary text-primary-foreground")}
          >
            <Copy className="h-4 w-4" />
            {copied ? "Đã sao chép" : "Sao chép"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
