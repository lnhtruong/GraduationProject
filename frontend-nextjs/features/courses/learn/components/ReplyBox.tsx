"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}

export function ReplyBox({ onSubmit, onCancel }: Props) {
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Viết câu trả lời..."
        className="w-full min-h-18 rounded-2xl border border-border/60 bg-background p-3 text-sm shadow-sm"
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Bạn đang trả lời</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Đang gửi..." : "Trả lời"}
          </button>
        </div>
      </div>
    </form>
  );
}
