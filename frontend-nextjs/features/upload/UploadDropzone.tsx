"use client";

import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadDropzone({
  onFileSelect,
  disabled,
}: UploadDropzoneProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  return (
    <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Upload Video</h3>
            <p className="text-sm text-muted-foreground">
              Choose a video file to create highlight reels
            </p>
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
              id="file-upload"
            />
            <Button asChild disabled={disabled}>
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Video File
              </label>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
