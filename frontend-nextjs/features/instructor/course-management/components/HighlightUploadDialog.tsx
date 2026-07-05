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
  onUploadSuccess?: () => void;
}

export function HighlightUploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
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
  } = useUpload({ autoCreateProject: false });
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setShowForm(false);
      // cancel() and setFile() come from the upload hook and may have
      // non-stable identities between renders. We intentionally omit them
      // from the dependency list to avoid re-running this effect repeatedly
      // when those handlers are recreated. The only dependency that matters
      // here is `open`.
       
      cancel();
      setFile(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (status === "completed" && clips.length > 0) {
      onUploadSuccess?.();
    }
  }, [status, clips, onUploadSuccess]);

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
  const isCompleted = status === "completed" && clips.length > 0;

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
      <DialogContent className="h-[90vh] w-[96vw] max-w-5xl overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl flex flex-col">
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-5 py-4 text-left sm:px-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              Tạo highlight video
            </div>
            <div className="mt-2">
              <DialogTitle className="text-xl font-bold">
                Tải lên video bài giảng & Tạo Highlight
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/80 mt-1">
                Chọn file, đặt topic và keyword để AI tự động cắt các clip ngắn chất lượng cao.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-4">
            {!file && (
              <UploadDropzone
                onFileSelect={handleFileSelect}
                variant="hero"
                title="Kéo và thả video highlight vào đây"
                subtitle="hoặc"
              />
            )}

            {file && !showForm && !isProcessing && !isCompleted && (
              <FilePreview
                file={file}
                onRemove={handleRemoveFile}
                onUpload={handleConfirmFile}
                isUploading={false}
              />
            )}

            {file && showForm && !isProcessing && !isCompleted && (
              <HighlightParamsForm
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
                isSubmitting={false}
                noCard={true}
              />
            )}

            {(isProcessing || isCompleted) && (
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
                mode="feed"
                onClose={() => onOpenChange(false)}
              />
            )}

            {!file && (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                Tip: dùng file gốc chất lượng cao để AI cắt highlight chuẩn hơn.
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-border/70 bg-background px-5 py-4 flex items-center justify-between gap-3 sm:px-6">
            <div className="text-xs text-muted-foreground">
              {isCompleted ? "Xử lý video hoàn tất" : isProcessing ? "Đang xử lý..." : "Sẵn sàng tải lên video mới"}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs font-semibold px-4 shadow-sm"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
