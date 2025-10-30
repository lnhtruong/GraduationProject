import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: string;
}

export default function UploadDropzone({
  onFileSelect,
  accept = "video/*",
  maxSize = "2GB",
}: UploadDropzoneProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onChoose() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  return (
    <div className="border-dashed border-2 border-border bg-card rounded-xl p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 size-24 grid place-items-center">
          <Upload className="size-10 text-primary" />
        </div>

        <h3 className="text-lg font-medium">Kéo và thả video vào đây</h3>
        <p className="text-sm text-muted-foreground">hoặc</p>

        <Button variant="default" onClick={onChoose}>
          Chọn file từ máy tính
        </Button>

        <p className="text-xs text-muted-foreground">
          Hỗ trợ: MP4, MOV, AVI (Tối đa {maxSize})
        </p>

        <input
          ref={fileRef}
          className="hidden"
          type="file"
          accept={accept}
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
