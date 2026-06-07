"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

interface RichTextBoxProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
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

export function RichTextBoxCKE({
  value,
  onChange,
  placeholder = "Nhập mô tả...",
  className,
}: RichTextBoxProps) {
  return (
    <div className={cn("system-ckeditor overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm", className)}>
      <RichTextEditorInner
        content={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

