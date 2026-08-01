import { createMutationHooks } from "@/features/_shared/react-query-factories";
import { toast } from "sonner";
import { mascotApi } from "./mascot.api";
import type { MascotParams } from "../types";
import { useInvalidateQuota } from "@/features/_shared/quota";

const useMascotJobBase = createMutationHooks<string, MascotParams>(
  "mascot",
  "start-job",
  (params) => mascotApi.startJob(params),
);

export function useMascotJob() {
  const invalidateQuota = useInvalidateQuota();

  return useMascotJobBase({
    onSuccess: () => {
      invalidateQuota();
    },
    onError: (error: Error) => {
      console.error("[useMascotJob] Error:", error);
      toast.error("Không thể bắt đầu tạo video mascot. Vui lòng thử lại.");
    },
  });
}
