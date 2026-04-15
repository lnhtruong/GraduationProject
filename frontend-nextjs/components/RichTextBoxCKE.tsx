"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RichTextBoxProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false },
) as unknown as React.ComponentType<{
  editor: unknown;
  data: string;
  config?: Record<string, unknown>;
  onChange: (event: unknown, editorInstance: { getData: () => string }) => void;
  onError?: (error: unknown) => void;
}>;

export function RichTextBoxCKE({
  value,
  onChange,
  placeholder = "Nhập mô tả...",
  className,
}: RichTextBoxProps) {
  const [editor, setEditor] = useState<unknown>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const licenseKey = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY ?? "GPL";

  useEffect(() => {
    let active = true;

    import("@ckeditor/ckeditor5-build-classic").then((mod) => {
      if (active) {
        setEditor(() => mod.default);
      }
    }).catch((error) => {
      console.error("[RichTextBox] Failed to load CKEditor build:", error);
      if (active) {
        setEditorError("Không thể tải CKEditor. Vui lòng thử lại.");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-40 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground",
          className,
        )}
      >
        {editorError ?? "Đang tải trình soạn thảo..."}
      </div>
    );
  }

  return (
    <div className={cn("system-ckeditor overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm", className)}>
      <CKEditor
        editor={editor as never}
        data={value}
        config={{
          licenseKey,
          placeholder,
          toolbar: {
            shouldNotGroupWhenFull: true,
            items: [
              "undo",
              "redo",
              "|",
              "heading",
              "|",
              "bold",
              "italic",
              "link",
              "bulletedList",
              "numberedList",
              "|",
              "blockQuote",
              "insertTable",
            ],
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
          link: {
            defaultProtocol: "https://",
          },
        }}
        onChange={(_, editorInstance) => {
          onChange(editorInstance.getData());
        }}
        onError={(error: unknown) => {
          console.error("[RichTextBox] CKEditor runtime error:", error);
          setEditorError("CKEditor gặp lỗi khi khởi tạo. Bạn có thể chuyển sang Tiptap.");
        }}
      />
    </div>
  );
}
