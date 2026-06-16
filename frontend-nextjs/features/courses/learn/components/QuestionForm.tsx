"use client";

import { useState } from "react";

interface Props {
  onSubmit: (content: string) => Promise<void>;
}

export function QuestionForm({ onSubmit }: Props) {
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        placeholder="Bạn đang thắc mắc điều gì trong bài này?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-h-[88px] rounded-2xl border border-border/60 bg-background p-3 text-sm shadow-sm"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Đang gửi..." : "Gửi câu hỏi"}
        </button>
      </div>
    </form>
  );
}
