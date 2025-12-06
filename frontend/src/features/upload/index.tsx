import { useNavigate } from "react-router-dom";
import UploadDropzone from "@/features/upload/components/UploadDropzone";
import FilePreview from "@/features/upload/components/FilePreview";
import UploadProgress from "@/features/upload/components/UploadProgress";
import ResultsSection from "@/features/upload/components/ResultsSection";
import useUpload from "@/features/upload/hooks/useUpload";

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
    clips,
    isDownloading,
    error,
    startUpload,
    cancel,
  } = useUpload();

  const navigate = useNavigate();

  // ============================================================================
  // HANDLERS
  // ============================================================================

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

  const handleViewResults = () => {
    // Navigate to editor with first clip
    if (clips && clips.length > 0 && clips[0].url) {
      const url = `/editor?src=${encodeURIComponent(clips[0].url)}`;
      navigate(url);
      return;
    }

    // If no clips, scroll to results section
    const resultsSection = document.querySelector('[data-results-section]');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ============================================================================
  // COMPUTED STATES
  // ============================================================================

  const isProcessing =
    status === "uploading" ||
    status === "pending" ||
    status === "processing";

  const isCompleted = status === "completed" && clips.length > 0;
  const showFilePreview = file && !isCompleted;
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
        {!file ? (
          // Show upload dropzone when no file selected
          <UploadDropzone onFileSelect={handleFileSelect} />
        ) : (
          <div className="space-y-4">
            {/* File Preview - hide when completed */}
            {showFilePreview && (
              <FilePreview
                file={file}
                onRemove={handleCancel}
                onUpload={handleUpload}
                isUploading={isProcessing}
              />
            )}

            {/* Progress/Status */}
            <UploadProgress
              progress={progress}
              status={status}
              jobId={jobId}
              isDownloading={isDownloading}
              clipsCount={clips.length}
              error={error}
              onViewResults={handleViewResults}
              onStartNew={handleStartNew}
            />
          </div>
        )}

        {/* Results Section */}
        <div data-results-section>
          <ResultsSection clips={clips} isVisible={showResults} />
        </div>
      </div>
    </div>
  );
}