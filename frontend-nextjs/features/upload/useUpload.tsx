"use client";

import { useState } from "react";
import { type ClipData } from "@/lib/shared/types";
import { uploadService } from "@/services/upload.service";

export interface Clip {
  id: string;
  url: string;
  title: string;
}

export function useUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  async function startUpload(fileToUpload: File) {
    setFile(fileToUpload);
    setProgress(0);
    setClips([]);
    setJobId(null);
    setStatus("uploading");

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", fileToUpload);

      // Upload file to API via Upload Service
      const uploadResult = await uploadService.uploadVideo(formData);

      setProgress(100);
      setStatus("processing");

      // Extract job ID from response
      const uploadJobId = uploadResult.job_id || uploadResult.jobId;

      if (!uploadJobId) {
        throw new Error("No job ID returned from upload");
      }
      setJobId(uploadJobId);
      setProgress(null);

      // Poll for job status
      const pollStatus = async (): Promise<void> => {
        try {
          const statusResult = await uploadService.pollJobStatus(uploadJobId);

          if (statusResult.status === "completed") {
            setStatus("completed");

            // Extract clips from result
            const resultClips = statusResult.clips || [];
            const formattedClips: Clip[] = resultClips.map(
              (clip: ClipData, index: number) => ({
                id: clip.id || `clip_${index}`,
                url:
                  clip.url ||
                  clip.download_url ||
                  clip.downloadUrl ||
                  `/download/${uploadJobId}`,
                title: clip.title || `Clip ${index + 1}`,
              })
            );

            setClips(formattedClips);
          } else if (
            statusResult.status === "failed" ||
            statusResult.status === "error"
          ) {
            throw new Error(statusResult.error || "Processing failed");
          } else {
            // Still processing, poll again after 2 seconds
            setTimeout(pollStatus, 2000);
          }
        } catch (error) {
          console.error("Status check failed:", error);
          setStatus("failed");
          setProgress(null);
        }
      };

      // Start polling after 1 second
      setTimeout(pollStatus, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("failed");
      setProgress(null);
      // You can also show the error message to user if needed
      // const errorMessage = handleApiError(error);
    }
  }

  function cancel() {
    setFile(null);
    setProgress(null);
    setStatus(null);
    setJobId(null);
    setClips([]);
    setIsDownloading(false);
  }

  return {
    file,
    setFile,
    progress,
    status,
    jobId,
    clips,
    isDownloading,
    startUpload,
    cancel,
  };
}

export default useUpload;
