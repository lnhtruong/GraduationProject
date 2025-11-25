"use client";

import { useRouter } from "next/navigation";
import UploadDropzone from "./UploadDropzone";
import FilePreview from "./FilePreview";
import UploadProgress from "./UploadProgress";
import useUpload from "./useUpload";

export default function UploadForm() {
  const {
    file,
    setFile,
    progress,
    status,
    jobId,
    clips,
    isDownloading,
    startUpload,
    cancel,
  } = useUpload();

  const router = useRouter();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleUpload = () => {
    if (file) {
      startUpload(file);
    }
  };

  const handleCancel = () => {
    cancel();
  };

  const handleStartNew = () => {
    cancel();
  };

  const isProcessing =
    progress !== null || (status !== null && status !== "completed");
  const isCompleted = status === "completed" && clips.length > 0;

  const handleViewResults = () => {
    // If there are clips, navigate to editor and load the first clip
    if (clips && clips.length > 0 && clips[0].url) {
      const url = `/editor?src=${encodeURIComponent(clips[0].url)}`;
      router.push(url);
      return;
    }

    // Fallback: do nothing (no results section) — user can view clips from UploadProgress
    return;
  };

  return (
    <div className="max-w-5xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Tải lên video bài giảng
        </h1>
        <p className="text-muted-foreground">
          Video của bạn sẽ được tự động cắt thành các clip ngắn hấp dẫn
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-6">
        {!file ? (
          <UploadDropzone onFileSelect={handleFileSelect} />
        ) : isCompleted ? (
          // Show only status when completed
          <UploadProgress
            progress={progress || 0}
            status={status || "Processing..."}
            jobId={jobId}
            isDownloading={isDownloading}
            clipsCount={clips.length}
            onViewResults={handleViewResults}
            onStartNew={handleStartNew}
          />
        ) : (
          <div className="space-y-4">
            {/* File preview - only show when not completed */}
            <FilePreview
              file={file}
              onRemove={handleCancel}
              onUpload={handleUpload}
              isUploading={isProcessing}
            />

            {/* Progress/Status */}
            <UploadProgress
              progress={progress || 0}
              status={status || "Processing..."}
              jobId={jobId}
              isDownloading={isDownloading}
              clipsCount={clips.length}
              onViewResults={handleViewResults}
              onStartNew={handleStartNew}
            />
          </div>
        )}
      </div>
    </div>
  );
}
