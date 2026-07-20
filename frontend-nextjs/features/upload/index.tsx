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
import { BUNNY_MAX_UPLOAD_LABEL } from "@/lib/env";
import type { HighlightParams } from "@/features/upload/types";
import {
  Check,
  FileVideo,
  Link2,
  Loader2,
  Target,
  UploadCloud,
} from "lucide-react";

type SourceMode = "file" | "existing-video";

const WORKFLOW_STEPS = [
  {
    title: "Chọn nguồn video",
    description: "Upload file hoặc dùng video đã có trên StudyLoop.",
  },
  {
    title: "Đặt tiêu chí cắt",
    description: "Nêu chủ đề, phần cần giữ và phần cần bỏ.",
  },
  {
    title: "Mở Studio",
    description: "Tinh chỉnh chữ, lớp hiển thị và xuất bản.",
  },
];

const AI_FINDINGS = [
  "Khái niệm trọng tâm",
  "Ví dụ minh họa",
  "Đoạn dễ ôn lại",
  "Câu hỏi kiểm tra",
];

function isAllowedStudyLoopVideoUrl(value: string) {
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
      <Card className="min-w-0 overflow-hidden rounded-2xl border-border/80 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Lộ trình highlight</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Bước hiện tại được cập nhật theo tiến trình xử lý.
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Target className="size-5" />
          </div>
        </div>

        <div className="mt-5">
          {WORKFLOW_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isDone = stepNumber < currentStep;

            return (
              <div key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="size-4" /> : stepNumber}
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "my-2 h-10 w-px rounded-full",
                        isDone ? "bg-primary/50" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div className={index < WORKFLOW_STEPS.length - 1 ? "pb-4" : ""}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{step.title}</p>
                    {isActive && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Đang thực hiện
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="min-w-0 rounded-2xl border-border/80 p-4 shadow-sm sm:p-5">
        <div className="text-sm font-semibold">StudyLoop sẽ tìm gì?</div>

        <div className="mt-2.5 grid gap-3 text-sm text-muted-foreground">
          {AI_FINDINGS.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="mt-1.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Check className="size-3" />
              </span>
              <span>{item}</span>
            </div>
          ))}
          <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs leading-5">
            {isAuthenticated
              ? "Kết quả được lưu để bạn mở lại trong Studio."
              : "Bạn cần đăng nhập để lưu video và mở Studio."}
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
  } = useUpload({ autoCreateProject: false });

  const router = useRouter();
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("file");
  const [showForm, setShowForm] = React.useState(false);
  const [existingVideoUrl, setExistingVideoUrl] = React.useState("");
  const [isOpeningStudio, setIsOpeningStudio] = React.useState(false);
  const [hasSubmittedHighlight, setHasSubmittedHighlight] = React.useState(false);

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
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Yêu cầu đăng nhập
      </h3>
      <p className="mx-auto mb-4 max-w-sm break-words px-1 text-sm leading-normal text-muted-foreground sm:px-4">
        {description}
      </p>
      <Button
        type="button"
        size="sm"
        className="px-6 font-medium"
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
    setHasSubmittedHighlight(false);
  };

  const handleConfirmFile = () => setShowForm(true);
  const handleCancelForm = () => setShowForm(false);

  const handleFormSubmit = (params: HighlightParams) => {
    if (sourceMode === "file") {
      if (!file) return;
      setHasSubmittedHighlight(true);
      void startUpload(file, params);
    } else {
      const trimmedUrl = existingVideoUrl.trim();
      if (!isAllowedStudyLoopVideoUrl(trimmedUrl)) {
        toast.error("Vui lòng nhập link video StudyLoop hợp lệ.");
        return;
      }
      setHasSubmittedHighlight(true);
      void startFromExistingVideo(trimmedUrl, params);
    }

    setShowForm(false);
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
    setIsOpeningStudio(false);
    setHasSubmittedHighlight(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
    setExistingVideoUrl("");
    setIsOpeningStudio(false);
    setHasSubmittedHighlight(false);
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
  const currentStep =
    isCompleted || isOpeningStudio
      ? 3
      : showForm || hasSubmittedHighlight || isProcessing
        ? 2
        : 1;

  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-5">
          {!isCompleted && (
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                Tạo vòng học mới · Bước {currentStep}/3
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                  Tạo highlight từ video bài giảng
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Đưa bài giảng vào StudyLoop, chọn mục tiêu học, rồi để AI tìm các đoạn giúp người học hiểu nhanh và ôn lại.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {!isAuthenticated ? (
              <div className="relative min-h-[320px] w-full rounded-2xl">
                {renderLockOverlay(
                  "Vui lòng đăng nhập để tải video bài giảng, cắt highlight tự động và mở Studio chỉnh sửa.",
                )}
              </div>
            ) : (
              <>
                {showSourceSwitcher && (
                  <Card className="overflow-hidden rounded-2xl border-border/80 p-4 shadow-sm sm:p-5">
                    <Tabs
                      value={sourceMode}
                      onValueChange={(value) => {
                        const nextMode = value as SourceMode;
                        setSourceMode(nextMode);
                        setShowForm(false);
                        setIsOpeningStudio(false);
                      }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-base font-semibold">
                            Chọn nguồn bài giảng
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            MP4, MOV, AVI, WEBM hoặc MKV · tối đa {BUNNY_MAX_UPLOAD_LABEL}
                          </p>
                        </div>
                        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1 sm:w-[360px]">
                          <TabsTrigger value="file" className="gap-2 py-2.5">
                            <UploadCloud className="h-4 w-4" />
                            Tải từ máy
                          </TabsTrigger>
                          <TabsTrigger
                            value="existing-video"
                            className="gap-2 py-2.5"
                          >
                            <Link2 className="h-4 w-4" />
                            Thư viện
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="file" className="mt-5">
                        {!file && (
                          <UploadDropzone
                            onFileSelect={handleFileSelect}
                            title="Thả bài giảng vào để bắt đầu vòng học mới"
                            subtitle="hoặc"
                            disabled={!isAuthenticated}
                            variant="hero"
                          />
                        )}
                      </TabsContent>

                      <TabsContent value="existing-video" className="mt-5">
                        <div className="flex min-h-[18rem] flex-col justify-center space-y-5 rounded-2xl border border-dashed border-border bg-muted/20 p-4 transition-all duration-200 focus-within:border-primary/60 sm:p-6">
                          <div className="flex items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                              <FileVideo className="size-5" />
                            </div>
                            <div>
                              <h2 className="font-semibold">
                                Chọn video trên StudyLoop
                              </h2>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Dán đường dẫn video đã có sẵn trên hệ thống để bắt đầu trích xuất highlight.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="existing-video-url">
                              Link video StudyLoop
                            </Label>
                            <Input
                              id="existing-video-url"
                              value={existingVideoUrl}
                              onChange={(event) =>
                                setExistingVideoUrl(event.target.value)
                              }
                              placeholder="Dán link video đã upload trên StudyLoop..."
                              className="h-11"
                              disabled={!isAuthenticated}
                            />
                            <p className="text-xs text-muted-foreground">
                              Hỗ trợ liên kết nội bộ hoặc CDN của StudyLoop.
                            </p>
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              if (
                                !isAllowedStudyLoopVideoUrl(existingVideoUrl.trim())
                              ) {
                                toast.error(
                                  "Vui lòng nhập link video StudyLoop hợp lệ.",
                                );
                                return;
                              }
                              setShowForm(true);
                            }}
                            disabled={!existingVideoUrl.trim() || !isAuthenticated}
                            className={cn(
                              "h-11 w-full font-medium transition-all duration-200",
                              !existingVideoUrl.trim()
                                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-100 hover:bg-slate-100"
                                : "bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                          >
                            Chọn cách cắt highlight
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </Card>
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
