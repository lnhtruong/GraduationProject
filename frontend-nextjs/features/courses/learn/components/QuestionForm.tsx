"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Props {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

export function QuestionForm({ onSubmit, placeholder = "Nhập bình luận..." }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = loading || !value.trim();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
      await onSubmit(value.trim());
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 relative">
      <div className="relative">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-h-[110px] rounded-2xl border border-border/80 bg-background p-3 sm:p-4 pr-3 sm:pr-4 pb-14 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-inner"
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-end pointer-events-none">
          {/* Bottom Right Button: Gửi */}
          <button
            type="submit"
            disabled={disabled}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </form>
  );
}
