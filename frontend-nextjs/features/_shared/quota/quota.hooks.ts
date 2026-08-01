import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { quotaApi } from "./quota.api";
import { calcCost } from "./quota.utils";
import type { QuotaFeature, QuotaSnapshot } from "./quota.types";

const quotaKeys = createKeyFactory("quota");
const snapshotKey = quotaKeys.custom("snapshot");

/**
 * Dùng `useQuery` trực tiếp thay vì `createQueryHooks` vì cần kiểm soát `retry`
 * và đọc được `error` — factory chung không expose hai thứ đó. Quota hỏng thì
 * chỉ mất phần hiển thị, không đáng retry 3 lần như mặc định.
 */
export function useQuota() {
  return useQuery<QuotaSnapshot>({
    queryKey: snapshotKey,
    queryFn: () => quotaApi.getSnapshot(),
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Chi phí của lần tạo sắp tới cộng với việc số dư có đủ hay không. Định nghĩa
 * "blocked" nằm đúng một chỗ ở đây thay vì lặp lại ở từng màn hình.
 */
export function useQuotaCost(feature: QuotaFeature, durationSec?: number) {
  const { data } = useQuota();
  const cost = data ? calcCost(feature, durationSec, data.pricing) : 0;
  return {
    quota: data,
    cost,
    blocked: data !== undefined && data.remaining < cost,
  };
}

/** Gọi sau khi tạo job thành công để số dư trên UI cập nhật ngay. */
export function useInvalidateQuota() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: snapshotKey });
}
