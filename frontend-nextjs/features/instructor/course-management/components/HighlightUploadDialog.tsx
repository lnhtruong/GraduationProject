"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import FilePreview from "@/features/upload/components/FilePreview";
import HighlightParamsForm from "@/features/upload/components/HighlightParamsForm";
import UploadProgress from "@/features/upload/components/UploadProgress";
import { useUpload } from "@/features/upload/hooks/useUpload";
import type { HighlightParams } from "@/features/upload/types";

interface HighlightUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HighlightUploadDialog({
  open,
  onOpenChange,
}: HighlightUploadDialogProps) {
  const router = useRouter();
  const {
    file,
    setFile,
    progress,
    status,
    jobId,
    createdProjectId,
    clips,
    isDownloading,
    error,
    stage,
    progressPercent,
    startUpload,
    ensureProjectForClip,
    cancel,
  } = useUpload();
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setShowForm(false);
      // cancel() and setFile() come from the upload hook and may have
      // non-stable identities between renders. We intentionally omit them
      // from the dependency list to avoid re-running this effect repeatedly
      // when those handlers are recreated. The only dependency that matters
      // here is `open`.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cancel();
      setFile(null);
    }
  }, [open]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowForm(false);
  };

  const handleConfirmFile = () => {
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  const handleFormSubmit = (params: HighlightParams) => {
    if (!file) {
      return;
    }

    startUpload(file, params);
    setShowForm(false);
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
  };

  const handleViewResults = async () => {
    const clip = clips[0];
    if (!clip?.url) {
      return;
    }

    const ensured = await ensureProjectForClip(clip);
    if (!ensured?.projectId) {
      return;
    }

    const params = new URLSearchParams({
      edit_id: String(ensured.projectId),
      src: clip.url,
    });

    if (ensured.videoId) {
      params.set("video_id", String(ensured.videoId));
    }

    router.push(`/editor?${params.toString()}`);
  };

  const isProcessing =
    status === "uploading" || status === "pending" || status === "processing";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          cancel();
          setShowForm(false);
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Tạo highlight video
          </div>
          <div>
            <DialogTitle className="text-xl sm:text-2xl">
              Upload video highlight ngay trong trang quản lý
            </DialogTitle>
            <DialogDescription className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Chọn file, đặt topic và keyword, rồi hệ thống sẽ tạo project
              highlight cho bạn mà không cần mở trang /upload.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 pb-1 pt-2">
          {!file && (
            <UploadDropzone
              onFileSelect={handleFileSelect}
              variant="hero"
              title="Kéo và thả video highlight vào đây"
              subtitle="hoặc"
            />
          )}

          {file && !showForm && !isProcessing && (
            <FilePreview
              file={file}
              onRemove={handleRemoveFile}
              onUpload={handleConfirmFile}
              isUploading={false}
            />
          )}

          {file && showForm && !isProcessing && (
            <HighlightParamsForm
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
              isSubmitting={false}
            />
          )}

          {isProcessing && (
            <UploadProgress
              progress={progress}
              status={status}
              jobId={jobId}
              isDownloading={isDownloading}
              clipsCount={clips.length}
              error={error}
              stage={stage}
              progressPercent={progressPercent}
              onViewResults={handleViewResults}
              onStartNew={handleStartNew}
            />
          )}

          {!file && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              Tip: dùng file gốc chất lượng cao để AI cắt highlight chuẩn hơn.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="text-xs text-muted-foreground">
            Sẵn sàng upload highlight mới
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
