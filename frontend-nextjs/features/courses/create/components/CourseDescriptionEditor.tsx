"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cloudinaryApi } from "@/features/cloudinary/api/cloudinary.api";
import { cn } from "@/lib/utils";

type EditorButtonProps = {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
};

function EditorButton({ active, onClick, title, children }: EditorButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title}
      className={cn("h-8 w-8", active && "bg-primary/15 text-primary")}
    >
      {children}
    </Button>
  );
}

interface CourseDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export default function CourseDescriptionEditor({
  value,
  onChange,
  disabled = false,
}: CourseDescriptionEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadingCount, setUploadingCount] = React.useState(0);

  const uploadImageFile = React.useCallback(async (file: File): Promise<string> => {
    const signature = await cloudinaryApi.getSignature(
      "course-description-images",
    );

    return cloudinaryApi.uploadDirectToCloudinary(
      file,
      signature,
      "image",
    );
  }, []);

  const uploadAndInsertImages = React.useCallback(
    async (
      files: File[],
      insert: (url: string, alt?: string) => void,
    ): Promise<void> => {
      if (files.length === 0) return;

      setUploadingCount((prev) => prev + files.length);

      for (const file of files) {
        try {
          const imageUrl = await uploadImageFile(file);
          insert(imageUrl, file.name || "Pasted image");
        } catch (error) {
          console.error("[CourseDescriptionEditor] Upload pasted image failed", error);
          toast.error("Không thể upload ảnh dán vào nội dung.");
        } finally {
          setUploadingCount((prev) => Math.max(0, prev - 1));
        }
      }
    },
    [uploadImageFile],
  );

  const editor = useEditor({
    editable: !disabled,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Highlight,
      Link.configure({
        autolink: true,
        openOnClick: false,
        protocols: ["http", "https", "mailto"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder:
          "Mô tả khóa học theo phong cách của bạn... Ví dụ: tiêu đề section, bullet list, best practices.",
      }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageFiles = items
          .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
          .map((item) => item.getAsFile())
          .filter((file): file is File => Boolean(file));

        if (imageFiles.length === 0) {
          return false;
        }

        void uploadAndInsertImages(imageFiles, (url, alt) => {
          const imageNode = view.state.schema.nodes.image?.create({ src: url, alt });
          if (!imageNode) return;

          const tr = view.state.tr.replaceSelectionWith(imageNode).scrollIntoView();
          view.dispatch(tr);
        });

        return true;
      },
      handleDrop(view, event) {
        const droppedFiles = Array.from(event.dataTransfer?.files ?? []).filter(
          isImageFile,
        );

        if (droppedFiles.length === 0) {
          return false;
        }

        void uploadAndInsertImages(droppedFiles, (url, alt) => {
          const imageNode = view.state.schema.nodes.image?.create({ src: url, alt });
          if (!imageNode) return;

          const tr = view.state.tr.replaceSelectionWith(imageNode).scrollIntoView();
          view.dispatch(tr);
        });

        return true;
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">
        Đang tải trình soạn thảo...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập URL", previousUrl || "https://");

    if (url === null) return;

    const normalized = url.trim();
    if (!normalized) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
  };

  const insertImageByUrl = async () => {
    const rawUrl = window.prompt("Nhập URL ảnh", "https://");
    if (!rawUrl) return;

    const imageUrl = rawUrl.trim();
    if (!imageUrl) return;

    editor.chain().focus().setImage({ src: imageUrl, alt: "Inserted image" }).run();
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []).filter(isImageFile);

    if (files.length > 0) {
      await uploadAndInsertImages(files, (url, alt) => {
        editor.chain().focus().setImage({ src: url, alt }).run();
      });
    }

    event.target.value = "";
  };

  return (
    <div className="rounded-xl border border-border/70 bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-border/70 p-2">
        <EditorButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Link"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Insert image by URL"
          onClick={() => {
            void insertImageByUrl();
          }}
        >
          <ImagePlus className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Upload image"
          onClick={triggerFilePicker}
        >
          <Upload className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </EditorButton>

        <EditorButton
          title="Clear format"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <Eraser className="h-4 w-4" />
        </EditorButton>
      </div>

      {uploadingCount > 0 && (
        <div className="border-b border-border/70 px-4 py-2 text-xs text-muted-foreground">
          Đang upload {uploadingCount} ảnh...
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          "min-h-52 px-4 py-3 text-sm",
          "[&_.ProseMirror]:min-h-44 [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold",
          "[&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold",
          "[&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-7",
          "[&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
          "[&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
          "[&_.ProseMirror_li]:mb-1",
          "[&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/40 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:italic",
          "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2",
          "[&_.ProseMirror_img]:my-3 [&_.ProseMirror_img]:w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:border [&_.ProseMirror_img]:border-border/50",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}
