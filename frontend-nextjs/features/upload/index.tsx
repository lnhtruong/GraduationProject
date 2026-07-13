"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilePreview from "@/features/upload/components/FilePreview";
import HighlightParamsForm from "@/features/upload/components/HighlightParamsForm";
import ResultsSection from "@/features/upload/components/ResultsSection";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import UploadProgress from "@/features/upload/components/UploadProgress";
import { useUpload } from "@/features/upload/hooks/useUpload";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { HighlightParams } from "@/features/upload/types";
import {
  Link2,
  Loader2,
  UploadCloud,
} from "lucide-react";

type SourceMode = "file" | "existing-video";

const WORKFLOW_STEPS = [
  {
    title: "Chọn nguồn video",
    description: "Upload file hoặc dùng video đã có trên LearnHub.",
  },
  {
    title: "Đặt tiêu chí cắt",
    description: "Nêu chủ đề, phần cần giữ và phần cần bỏ.",
  },
  {
    title: "Mở Studio",
    description: "Tinh chỉnh chữ, Mascot và xuất bản.",
  },
];

function isAllowedLearnHubVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname.includes("bunnycdn.com") ||
      hostname.includes("b-cdn.net") ||
      hostname.startsWith("vz-")
    );
  } catch {
    return false;
  }
}

function WorkflowRail({
  currentStep,
  isAuthenticated,
}: {
  currentStep: number;
  isAuthenticated: boolean;
}) {
  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
      <Card className="min-w-0 p-4 sm:p-5">
        <div className="text-sm font-semibold">
          Luồng tạo highlight
        </div>

        <div className="mt-2.5 space-y-3">
          {WORKFLOW_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isDone = stepNumber < currentStep;

            return (
              <div key={step.title} className="flex gap-3">
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isDone
                      ? "border-primary text-primary"
                      : isActive
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  ].join(" ")}
                >
                  {stepNumber}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="min-w-0 p-4 sm:p-5">
        <div className="text-sm font-semibold">
          Trước khi bắt đầu
        </div>

        <div className="mt-2.5 grid gap-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>File video tối đa 2GB, ưu tiên MP4 hoặc WEBM.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>Nội dung càng rõ chủ đề thì highlight càng dễ đúng ý.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              {isAuthenticated
                ? "Kết quả được lưu để bạn mở lại trong Studio."
                : "Bạn cần đăng nhập để lưu video và mở Studio."}
            </span>
          </div>
        </div>
      </Card>
    </aside>
  );
}

export default function Upload() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
  } = useUpload();

  const router = useRouter();
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("file");
  const [showForm, setShowForm] = React.useState(false);
  const [existingVideoUrl, setExistingVideoUrl] = React.useState("");
  const [isOpeningStudio, setIsOpeningStudio] = React.useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/signin?returnUrl=${returnUrl}`);
  };

  const renderLockOverlay = (description: string) => (
    <div className="absolute inset-0 z-10 flex min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-background/95 p-4 text-center backdrop-blur-[2px] transition-all duration-300 sm:p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">
        Yêu cầu đăng nhập
      </h3>
      <p className="mx-auto mb-4 max-w-sm break-words px-1 text-sm leading-normal text-muted-foreground sm:px-4">
        {description}
      </p>
      <Button
        type="button"
        size="sm"
        className="font-medium px-6"
        onClick={handleLogin}
      >
        Đăng nhập ngay
      </Button>
    </div>
  );

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowForm(false);
    setIsOpeningStudio(false);
  };

  const handleConfirmFile = () => setShowForm(true);
  const handleCancelForm = () => setShowForm(false);

  const handleFormSubmit = (params: HighlightParams) => {
    if (sourceMode === "file") {
      if (!file) return;
      void startUpload(file, params);
    } else {
      const trimmedUrl = existingVideoUrl.trim();
      if (!isAllowedLearnHubVideoUrl(trimmedUrl)) {
        toast.error("Vui lòng nhập link video LearnHub hợp lệ.");
        return;
      }
      void startFromExistingVideo(trimmedUrl, params);
    }

    setShowForm(false);
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
    setIsOpeningStudio(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
    setExistingVideoUrl("");
    setIsOpeningStudio(false);
  };

  const handleEditClip = async (clip: (typeof clips)[number]) => {
    if (!clip.url) return;

    setIsOpeningStudio(true);

    const ensured = await ensureProjectForClip(clip);
    const params = new URLSearchParams({ src: clip.url, from: "highlight" });

    if (ensured?.projectId) {
      params.set("edit_id", String(ensured.projectId));
      if (ensured.videoId) params.set("video_id", String(ensured.videoId));
    } else if (clip.videoId) {
      params.set("video_id", String(clip.videoId));
    }

    window.setTimeout(() => {
      router.push(`/editor?${params.toString()}`);
    }, 300);
  };

  const handleViewResults = async () => {
    if (clips.length === 1 && clips[0].url) {
      await handleEditClip(clips[0]);
      return;
    }

    document
      .querySelector("[data-results-section]")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const isProcessing =
    status === "uploading" || status === "pending" || status === "processing";
  const isCompleted = status === "completed" && clips.length > 0;
  const isFailed = status === "failed";
  const showFilePreview =
    sourceMode === "file" &&
    file &&
    !showForm &&
    status === "idle" &&
    !isCompleted;
  const showResults = isCompleted;
  const showSourceSwitcher = !file && !showForm && !isProcessing && !isCompleted;
  const currentStep = isCompleted || isOpeningStudio ? 3 : showForm ? 2 : 1;

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5">
          {!isCompleted && (
            <div className="space-y-3">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                  Tạo highlight từ video bài giảng
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Tự động trích xuất các đoạn nổi bật từ video bài giảng. Chọn nguồn video và để AI của LearnHub làm phần việc còn lại.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {!isAuthenticated ? (
              <div className="relative min-h-[350px] w-full rounded-2xl">
                {renderLockOverlay(
                  "Vui lòng đăng nhập để sử dụng tính năng tải video bài giảng, cắt highlight tự động và chèn Mascot sinh động."
                )}
              </div>
            ) : (
              <>
                {showSourceSwitcher && (
                  <Tabs
                    value={sourceMode}
                    onValueChange={(value) => {
                      const nextMode = value as SourceMode;
                      setSourceMode(nextMode);
                      setShowForm(false);
                      setIsOpeningStudio(false);
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

                    <TabsContent value="file" className="mt-4 space-y-4">
                      <div className="relative">
                        {!file && (
                          <UploadDropzone
                            onFileSelect={handleFileSelect}
                            title="Kéo video bài giảng vào đây"
                            subtitle="hoặc"
                            disabled={!isAuthenticated}
                          />
                        )}

                      </div>
                    </TabsContent>

                  <TabsContent value="existing-video" className="mt-4">
                      <div className="relative">
                        <Card className="flex min-h-[20rem] flex-col justify-center space-y-5 rounded-2xl border-2 border-dashed border-slate-300 bg-background p-4 shadow-none transition-all duration-200 focus-within:border-primary/60 sm:p-6">
                          <div className="flex items-start gap-3">
                                                        <div>
                              <h2 className="font-semibold">Nhập link video LearnHub</h2>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Dán đường dẫn của video đã có sẵn trên hệ thống để bắt đầu trích xuất highlight.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="existing-video-url">
                              Link video LearnHub
                            </Label>
                            <Input
                              id="existing-video-url"
                              value={existingVideoUrl}
                              onChange={(event) =>
                                setExistingVideoUrl(event.target.value)
                              }
                              placeholder="Dán link video đã upload trên LearnHub..."
                              className="h-11"
                              disabled={!isAuthenticated}
                            />
                            <p className="text-xs text-muted-foreground">
                              Hệ thống hỗ trợ các liên kết nội bộ hoặc CDN của LearnHub.
                            </p>
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              if (
                                !isAllowedLearnHubVideoUrl(existingVideoUrl.trim())
                              ) {
                                toast.error(
                                  "Vui lòng nhập link video LearnHub hợp lệ.",
                                );
                                return;
                              }
                              setShowForm(true);
                            }}
                            disabled={!existingVideoUrl.trim() || !isAuthenticated}
                            className={cn(
                              "h-11 w-full font-medium transition-all duration-200",
                              !existingVideoUrl.trim()
                                ? "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-100 cursor-not-allowed pointer-events-none opacity-100"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                          >
                            Chọn cách cắt highlight
                          </Button>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {showFilePreview && (
                  <FilePreview
                    file={file}
                    onRemove={handleRemoveFile}
                    onUpload={handleConfirmFile}
                    isUploading={false}
                  />
                )}

                {showForm && !isProcessing && (
                  <HighlightParamsForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelForm}
                    isSubmitting={false}
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
                  />
                )}

              </>
            )}

            <div data-results-section>
              <ResultsSection
                clips={clips}
                isVisible={showResults}
                onEditClip={handleEditClip}
                onStartNew={handleStartNew}
              />
            </div>
          </div>
        </section>

        <WorkflowRail currentStep={currentStep} isAuthenticated={isAuthenticated} />
      </div>
    </main>
  );
}


