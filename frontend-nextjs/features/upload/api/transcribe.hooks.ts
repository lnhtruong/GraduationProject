/**
 * Transcribe Feature Hooks
 */

import { transcribeApi, type StartTranscribeJobParams } from "./transcribe.api";
import { createMutationHooks } from "@/features/_shared/react-query-factories";

const useStartTranscribeJobMutation = createMutationHooks<
  string,
  StartTranscribeJobParams
>("upload", "start-transcribe-job", transcribeApi.startJob);

export function useStartTranscribeJob(options?: {
  onJobStarted?: (jobId: string) => void;
  onError?: (error: Error) => void;
}) {
  return useStartTranscribeJobMutation({
    onSuccess: (jobId) => {
      options?.onJobStarted?.(jobId);
    },
    onError: options?.onError,
  });
}
