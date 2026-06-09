"use client";

import React, { forwardRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

interface RichTextBoxProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const RichTextEditorInner = dynamic(
  () => import("./RichTextEditorInner"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-40 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground animate-pulse flex items-center justify-center">
        Đang tải trình soạn thảo...
      </div>
    ),
  }
);

export const RichTextBoxCKE = forwardRef<HTMLDivElement, RichTextBoxProps>(
  function RichTextBoxCKE(
    {
      value,
      onChange,
      placeholder = "Nhập mô tả...",
      className,
      error = false,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          "system-ckeditor overflow-hidden rounded-xl border bg-card shadow-sm focus:outline-none focus:ring-1",
          error
            ? "border-destructive focus:ring-destructive"
            : "border-border/70 focus:ring-primary/30",
          className
        )}
      >
        <RichTextEditorInner
          content={value}
          onChange={onChange}
          placeholder={placeholder}
          error={error ? "Lỗi" : undefined}
        />
      </div>
    );
  }
);
