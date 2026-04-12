"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface Props {
  items: string[];
}

const INITIAL_VISIBLE = 8;

export function WhatYouLearnSection({ items }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL_VISIBLE);
  const hasMore = items.length > INITIAL_VISIBLE;

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <h2 className="mb-5 text-xl font-bold">Bạn sẽ học được gì</h2>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {visible.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <CheckCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
            <span className="text-sm text-foreground">{item}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? "Thu gọn ▲" : `Xem thêm ${items.length - INITIAL_VISIBLE} mục ▼`}
        </button>
      )}
    </section>
  );
}
