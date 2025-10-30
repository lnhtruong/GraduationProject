import { Button } from "@/components/ui/button";
import { FileVideo, X } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onUpload: () => void;
  isUploading?: boolean;
}

export default function FilePreview({
  file,
  onRemove,
  onUpload,
  isUploading = false,
}: FilePreviewProps) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileVideo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button onClick={onUpload} disabled={isUploading} size="sm">
            {isUploading ? "Đang tải..." : "Tải lên"}
          </Button>
        </div>
      </div>
    </div>
  );
}
