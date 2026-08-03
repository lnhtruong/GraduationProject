/**
 * Upload Feature Hooks
 */

import { uploadApi } from "./upload.api";
import { createMutationHooks } from "@/features/_shared/react-query-factories";
import type { HighlightReelLinkParams } from "../types";
import { useInvalidateQuota } from "@/features/_shared/quota";

// ============================================================================
// HOOKS
// ============================================================================

const useStartHighlightLinkJob = createMutationHooks<
  string,
  HighlightReelLinkParams
>("upload", "start-link-job", uploadApi.startJobFromLink);

export function useProcessHighlightLink(options?: {
  onJobStarted?: (jobId: string) => void;
  onError?: (error: Error) => void;
}) {
  const invalidateQuota = useInvalidateQuota();

  return useStartHighlightLinkJob({
    onSuccess: (jobId) => {
      invalidateQuota();
      options?.onJobStarted?.(jobId);
    },
    onError: options?.onError,
  });
}
