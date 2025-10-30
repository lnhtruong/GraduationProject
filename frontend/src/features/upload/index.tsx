import { useState } from "react";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import FilePreview from "@/features/upload/components/FilePreview";
import UploadProgress from "@/features/upload/components/UploadProgress";
import ResultsSection from "@/features/upload/components/ResultsSection";
import useUpload from "@/features/upload/hooks/useUpload";

export default function Upload() {
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

  const [showResults, setShowResults] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowResults(false);
  };

  const handleUpload = () => {
    if (file) {
      startUpload(file);
    }
  };

  const handleCancel = () => {
    cancel();
    setShowResults(false);
  };

  const handleStartNew = () => {
    cancel();
    setShowResults(false);
  };

  const isProcessing =
    progress !== null || (status !== null && status !== "completed");
  const isCompleted = status === "completed" && clips.length > 0;

  return (
    <div className="max-w-5xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Tải lên video bài giảng</h1>
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
            progress={progress}
            status={status}
            jobId={jobId}
            isDownloading={isDownloading}
            clipsCount={clips.length}
            onViewResults={() => setShowResults(true)}
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
              progress={progress}
              status={status}
              jobId={jobId}
              isDownloading={isDownloading}
              clipsCount={clips.length}
              onViewResults={() => setShowResults(true)}
              onStartNew={handleStartNew}
            />
          </div>
        )}
      </div>

      {/* Results */}
      <ResultsSection clips={clips} isVisible={showResults} />
    </div>
  );
}
