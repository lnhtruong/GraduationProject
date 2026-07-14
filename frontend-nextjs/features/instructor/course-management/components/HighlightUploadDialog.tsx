"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import type { HighlightParams } from "@/features/upload/types";

type SourceMode = "file" | "existing-video";

function isAllowedStudyLoopVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname.includes("bunnycdn.com") ||
      hostname.includes("b-cdn.net") ||
      hostname.includes("cloudinary.com") ||
      hostname.startsWith("vz-")
    );
  } catch {
    return false;
  }
}

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
    clips,
    isDownloading,
    error,
    stage,
    progressPercent,
    jobType,
    startUpload,
    startFromExistingVideo,
    ensureProjectForClip,
    cancel,
  } = useUpload({ autoCreateProject: false });
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("file");
  const [existingVideoUrl, setExistingVideoUrl] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const notifiedJobRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setShowForm(false);
      setSourceMode("file");
      setExistingVideoUrl("");
      notifiedJobRef.current = null;
      // cancel() and setFile() come from the upload hook and may have
      // non-stable identities between renders. We intentionally omit them
      // from the dependency list to avoid re-running this effect repeatedly
      // when those handlers are recreated. The only dependency that matters
      // here is `open`.
       
      cancel();
      setFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (status === "completed" && clips.length > 0 && notifiedJobRef.current !== jobId) {
      notifiedJobRef.current = jobId ?? "completed";
      onUploadSuccess?.();
    }
  }, [status, clips.length, jobId, onUploadSuccess]);

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
    if (sourceMode === "file") {
      if (!file) return;
      void startUpload(file, params);
    } else {
      const trimmedUrl = existingVideoUrl.trim();
      if (!isAllowedStudyLoopVideoUrl(trimmedUrl)) {
        toast.error("Vui lòng nhập link video StudyLoop hợp lệ.");
        return;
      }
      void startFromExistingVideo(trimmedUrl, params);
    }
    setShowForm(false);
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
    setExistingVideoUrl("");
    setSourceMode("file");
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
  const isFailed = status === "failed";
  const showSourceSwitcher =
    !file && !showForm && !isProcessing && !isCompleted && !isFailed;

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
          <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-background px-5 py-4 text-left sm:px-6">
            <DialogTitle className="text-xl font-bold">
              Tạo highlight cho feed
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Chọn file hoặc dùng video đã có, đặt tiêu chí cắt rồi lưu kết quả vào thư viện feed.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-4">
            {showSourceSwitcher && (
              <Tabs
                value={sourceMode}
                onValueChange={(value) => {
                  setSourceMode(value as SourceMode);
                  setShowForm(false);
                }}
              >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1 sm:w-[520px]">
                  <TabsTrigger value="file" className="gap-2 py-2.5">
                    <UploadCloud className="h-4 w-4" />
                    Tải từ máy
                  </TabsTrigger>
                  <TabsTrigger value="existing-video" className="gap-2 py-2.5">
                    <Link2 className="h-4 w-4" />
                    Video đã có
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-4">
                  <UploadDropzone
                    onFileSelect={handleFileSelect}
                    title="Kéo video bài giảng vào đây"
                    subtitle="hoặc"
                  />
                </TabsContent>

                <TabsContent value="existing-video" className="mt-4">
                  <Card className="flex min-h-[20rem] flex-col justify-center space-y-5 rounded-2xl border-2 border-dashed border-slate-300 bg-background p-4 shadow-none transition-all duration-200 focus-within:border-primary/60 sm:p-6">
                    <div>
                      <h2 className="font-semibold">Nhập link video StudyLoop</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Dán đường dẫn video đã upload hoặc link CDN để tạo highlight ngay trong feed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feed-existing-video-url">
                        Link video StudyLoop
                      </Label>
                      <Input
                        id="feed-existing-video-url"
                        value={existingVideoUrl}
                        onChange={(event) => setExistingVideoUrl(event.target.value)}
                        placeholder="Dán link video đã upload trên StudyLoop..."
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Hỗ trợ Bunny/CDN/Cloudinary đang dùng trong hệ thống.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        if (!isAllowedStudyLoopVideoUrl(existingVideoUrl.trim())) {
                          toast.error("Vui lòng nhập link video StudyLoop hợp lệ.");
                          return;
                        }
                        setShowForm(true);
                      }}
                      disabled={!existingVideoUrl.trim()}
                      className={cn(
                        "h-11 w-full font-medium transition-all duration-200",
                        !existingVideoUrl.trim() &&
                          "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-100 hover:bg-slate-100",
                      )}
                    >
                      Chọn cách cắt highlight
                    </Button>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {sourceMode === "file" && file && !showForm && !isProcessing && !isCompleted && (
              <FilePreview
                file={file}
                onRemove={handleRemoveFile}
                onUpload={handleConfirmFile}
                isUploading={false}
              />
            )}

            {showForm && !isProcessing && !isCompleted && (
              <HighlightParamsForm
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
                isSubmitting={false}
                noCard={true}
              />
            )}

            {(isProcessing || isCompleted || isFailed) && (
              <UploadProgress
                progress={progress}
                status={status}
                jobId={jobId}
                isDownloading={isDownloading}
                clipsCount={clips.length}
                error={error}
                stage={stage}
                progressPercent={progressPercent}
                jobType={jobType}
                onViewResults={handleViewResults}
                onStartNew={handleStartNew}
                mode="feed"
                onClose={() => onOpenChange(false)}
              />
            )}
          </div>

          <div className="sticky bottom-0 border-t border-border/70 bg-background px-5 py-4 flex items-center justify-between gap-3 sm:px-6">
            <div className="text-xs text-muted-foreground">
              {isCompleted ? "Xử lý video hoàn tất" : isProcessing ? "Đang xử lý..." : "Sẵn sàng chọn video"}
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
