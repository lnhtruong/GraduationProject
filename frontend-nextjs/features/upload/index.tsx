"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import FilePreview from "@/features/upload/components/FilePreview";
import HighlightParamsForm from "@/features/upload/components/HighlightParamsForm";
import UploadProgress from "@/features/upload/components/UploadProgress";
import ResultsSection from "@/features/upload/components/ResultsSection";
import { useUpload } from "@/features/upload/hooks/useUpload";
import type { HighlightParams } from "@/features/upload/types";

// ============================================================================
// COMPONENT
// ============================================================================

export default function Upload() {
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

  const router = useRouter();

  // ============================================================================
  // STATE - Form visibility
  // ============================================================================
  const [showForm, setShowForm] = React.useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowForm(false); // Reset form khi chọn file mới
  };

  const handleConfirmFile = () => {
    setShowForm(true); // Hiển thị form khi user confirm file
  };

  const handleCancelForm = () => {
    setShowForm(false); // Quay lại file preview
  };

  const handleFormSubmit = (params: HighlightParams) => {
    if (file) {
      startUpload(file, params);
      setShowForm(false); // Ẩn form khi bắt đầu upload
    }
  };

  const handleRemoveFile = () => {
    cancel();
    setShowForm(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowForm(false);
  };

  const handleEditClip = async (clip: (typeof clips)[number]) => {
    const ensured = await ensureProjectForClip(clip);
    const params = new URLSearchParams({
      src: clip.url,
    });

    if (ensured?.projectId) {
      params.set("edit_id", String(ensured.projectId));
      params.set("video_id", String(ensured.videoId));
    } else if (clip.videoId) {
      params.set("video_id", String(clip.videoId));
    }

    router.push(`/editor?${params.toString()}`);
  };

  const handleViewResults = async () => {
    if (clips && clips.length > 0 && clips[0].url) {
      await handleEditClip(clips[0]);
      return;
    }

    // If no clips, scroll to results section
    const resultsSection = document.querySelector("[data-results-section]");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ============================================================================
  // COMPUTED STATES
  // ============================================================================

  const isProcessing =
    status === "uploading" || status === "pending" || status === "processing";

  const isCompleted = status === "completed" && clips.length > 0;
  const showFilePreview = file && !showForm && !isProcessing && !isCompleted;
  const showResults = isCompleted;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Tải lên video bài giảng</h1>
        <p className="text-muted-foreground">
          Video của bạn sẽ được tự động cắt thành các clip ngắn hấp dẫn
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-6">
        {/* Step 1: Upload Dropzone */}
        {!file && <UploadDropzone onFileSelect={handleFileSelect} />}

        {/* Step 2: File Preview (cho user confirm hoặc đổi file) */}
        {showFilePreview && (
          <FilePreview
            file={file}
            onRemove={handleRemoveFile}
            onUpload={handleConfirmFile}
            isUploading={false}
          />
        )}

        {/* Step 3: Highlight Params Form */}
        {file && showForm && !isProcessing && (
          <HighlightParamsForm
            onSubmit={handleFormSubmit}
            onCancel={handleCancelForm}
            isSubmitting={false}
          />
        )}

        {/* Step 4: Processing Status */}
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

        {/* Step 5: Success Status (included in UploadProgress) */}
        {isCompleted && (
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

        {/* Step 6: Results Section */}
        <div data-results-section>
          <ResultsSection
            clips={clips}
            isVisible={showResults}
            createdProjectId={createdProjectId}
            onEditClip={handleEditClip}
          />
        </div>
      </div>
    </div>
  );
}
