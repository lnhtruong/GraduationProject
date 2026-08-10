"use client";

import { cn } from "@/lib/utils";
import { useQuotaCost } from "./quota.hooks";
import { describeCost, formatResetAt } from "./quota.utils";
import type { QuotaFeature } from "./quota.types";

interface QuotaNoticeProps {
  feature: QuotaFeature;
  /** Thời lượng video/đoạn sắp xử lý, tính bằng giây. */
  durationSec?: number;
  className?: string;
}

/**
 * Việc sắp làm, ghép sau số credit. Server có thể thêm feature mới trước khi FE
 * kịp cập nhật, nên tra không thấy thì bỏ trống chứ không hiện chuỗi lạ.
 */
const PURPOSE: Record<QuotaFeature, string> = {
  highlight: "để highlight video này",
  transcribe: "để tạo phụ đề cho video này",
  quiz: "để tạo quiz cho bài học này",
  mascot: "để tạo mascot cho video này",
};

/**
 * Hiển thị chi phí credit của lần tạo sắp tới và số dư còn lại.
 * Dùng chung ở màn Upload, Editor (mascot) và dialog tạo Quiz AI.
 */
export function QuotaNotice({
  feature,
  durationSec,
  className,
}: QuotaNoticeProps) {
  const {
    quota: data,
    cost,
    blocked: insufficient,
  } = useQuotaCost(feature, durationSec);

  if (!data) return null;

  const rate = describeCost(feature, durationSec, data.pricing);
  const resetAt = formatResetAt(data.resetAt);
  const purpose = PURPOSE[feature] ? ` ${PURPOSE[feature]}` : "";

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm",
        insufficient
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border bg-muted/30 text-muted-foreground",
        className,
      )}
    >
      <span className="font-medium">
        {insufficient
          ? `Cần ${cost} quota${purpose}, bạn chỉ còn ${data.remaining}`
          : `Bạn sẽ tốn ${cost} quota${purpose}`}
        {rate ? (
          <span className="font-normal opacity-80"> · {rate}</span>
        ) : null}
      </span>
      <span className="text-xs">
        Bạn còn {data.remaining}/{data.limit} quota
        {resetAt ? ` · Reset lúc ${resetAt}` : ""}
      </span>
    </div>
  );
}
