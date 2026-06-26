"use client";

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

interface Props {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

export function ReplyBox({ onSubmit, onCancel, placeholder = "Viết câu trả lời..." }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const disabled = loading || !value.trim();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      await onSubmit(value.trim());
      setValue("");
      onCancel?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 relative">
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[96px] rounded-2xl border border-border/80 bg-background p-3 sm:p-4 pr-3 sm:pr-4 pb-14 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-inner"
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-end pointer-events-none">
          {/* Bottom Right Buttons: Hủy và Gửi */}
          <div className="flex gap-2 pointer-events-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Hủy"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {loading ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
