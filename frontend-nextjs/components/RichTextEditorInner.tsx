import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
  ClassicEditor,
  // Basic styles
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  // Font
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  // Layout & Alignment
  Alignment,
  Indent,
  IndentBlock,
  // Content blocks
  BlockQuote,
  Heading,
  HorizontalLine,
  Link,
  List,
  ListProperties,
  TodoList,
  Paragraph,
  // Tables
  Table,
  TableToolbar,
  TableCellProperties,
  TableProperties,
  TableCaption,
  TableColumnResize,
  // Media & Images
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Base64UploadAdapter,
  MediaEmbed,
  // Utils
  Essentials,
  Autoformat,
  SourceEditing,
  Undo,
} from "ckeditor5";

import "ckeditor5/ckeditor5.css";

interface RichTextEditorInnerProps {
  content?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function RichTextEditorInner({
  content = "",
  onChange,
  placeholder,
  error,
}: RichTextEditorInnerProps) {
  const [data, setData] = useState<string>(content);

  useEffect(() => {
    setData(content);
  }, [content]);

  return (
    <div className="space-y-1 w-full text-foreground">
      <div
        className={`border rounded-lg bg-background ${
          error ? "border-red-500" : "border-input"
        }`}
      >
        <CKEditor
          editor={ClassicEditor}
          config={{
            licenseKey: "GPL",
            placeholder: placeholder,
            // Cấu hình Toolbar đầy đủ
            toolbar: {
              items: [
                "undo",
                "redo",
                "|",
                "sourceEditing", // Xem mã HTML
                "|",
                "heading",
                "|",
                "fontFamily",
                "fontSize",
                "fontColor",
                "fontBackgroundColor",
                "|",
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "subscript",
                "superscript",
                "code",
                "|",
                "alignment", // Căn trái/phải/giữa/đều
                "outdent",
                "indent",
                "|",
                "bulletedList",
                "numberedList",
                "|",
                "link",
                "insertTable",
                "mediaEmbed",
                "imageUpload",
                "blockQuote",
                "horizontalLine",
              ],
              shouldNotGroupWhenFull: false, // Tự động nhóm vào dấu 3 chấm nếu màn hình nhỏ
            },
            // Cấu hình Plugin
            plugins: [
              // Core
              Essentials,
              Autoformat,
              Undo,
              // Layout
              Alignment,
              Indent,
              IndentBlock,
              Heading,
              // Font
              FontFamily,
              FontSize,
              FontColor,
              FontBackgroundColor,
              // Text Formatting
              Bold,
              Italic,
              Underline,
              Strikethrough,
              Subscript,
              Superscript,
              Code,
              // Content
              BlockQuote,
              HorizontalLine,
              Link,
              List,
              ListProperties,
              TodoList,
              Paragraph,
              SourceEditing,
              // Media
              Image,
              ImageCaption,
              ImageResize,
              ImageStyle,
              ImageToolbar,
              ImageUpload,
              Base64UploadAdapter,
              MediaEmbed,
              // Table
              Table,
              TableToolbar,
              TableCellProperties,
              TableProperties,
              TableCaption,
              TableColumnResize,
            ],
            // Cấu hình hiển thị ảnh
            image: {
              toolbar: [
                "imageStyle:inline",
                "imageStyle:block",
                "imageStyle:side",
                "|",
                "toggleImageCaption",
                "imageTextAlternative",
              ],
            },
            // Cấu hình hiển thị bảng
            table: {
              contentToolbar: [
                "tableColumn",
                "tableRow",
                "mergeTableCells",
                "tableCellProperties",
                "tableProperties",
              ],
            },
            // Cấu hình Link
            link: {
              addTargetToExternalLinks: true, // Tự động mở link tab mới
            },
            // Cấu hình List
            list: {
              properties: {
                styles: true,
                startIndex: true,
                reversed: true,
              },
            },
          }}
          data={data}
          onChange={(_, editor) => {
            const html = editor.getData();
            setData(html);
            onChange?.(html);
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
