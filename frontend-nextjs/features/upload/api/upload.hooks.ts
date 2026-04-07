/**
 * Upload Feature Hooks
 */

import { uploadApi } from "./upload.api";
import { createMutationHooks } from "@/features/_shared/hooks";
import type { HighlightReelParams } from "../types";

// ============================================================================
// HOOKS
// ============================================================================

const useStartUploadJob = createMutationHooks<string, HighlightReelParams>(
  "upload",
  "start-job",
  uploadApi.startJob,
);

/**
 * Start upload job only.
 * Progress and completion are handled by socket events in useUpload.
 */
export function useProcessHighlight(options?: {
  onJobStarted?: (jobId: string) => void;
  onError?: (error: Error) => void;
}) {
  return useStartUploadJob({
    onSuccess: (jobId) => {
      options?.onJobStarted?.(jobId);
    },
    onError: options?.onError,
  });
}

export const useUploadHighlight = useStartUploadJob;
