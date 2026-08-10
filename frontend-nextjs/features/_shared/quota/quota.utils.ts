import type { QuotaFeature, QuotaPricing } from "./quota.types";

function hasDuration(durationSec: number | undefined): durationSec is number {
  return (
    durationSec !== undefined && Number.isFinite(durationSec) && durationSec > 0
  );
}

/** Số phút bị tính tiền: làm tròn lên, tối thiểu 1 phút, cắt trần maxDurationSec. */
function billableMinutes(durationSec: number, maxDurationSec: number): number {
  return Math.max(1, Math.ceil(Math.min(durationSec, maxDurationSec) / 60));
}

/**
 * Bản sao công thức tính giá của backend
 * (`inference_service/src/quota/quota.pricing.ts`). Bảng giá luôn lấy từ
 * `GET /mascot_colab/quota` nên không hardcode con số nào ở đây.
 */
export function calcCost(
  feature: QuotaFeature,
  durationSec: number | undefined,
  pricing: QuotaPricing,
): number {
  const cost = pricing.costs[feature];
  if (!cost) return 1;
  if (!cost.perMinute) return Math.max(1, cost.credits);

  const minutes = hasDuration(durationSec)
    ? billableMinutes(durationSec, pricing.maxDurationSec)
    : 1;

  return Math.max(1, cost.credits * minutes);
}

/**
 * Giải thích con số quota cho người dùng, ví dụ "10 quota/phút × 3 phút".
 * Chưa biết thời lượng thì chỉ nêu đơn giá, không bịa ra số phút.
 */
export function describeCost(
  feature: QuotaFeature,
  durationSec: number | undefined,
  pricing: QuotaPricing,
): string {
  const cost = pricing.costs[feature];
  if (!cost) return "";
  if (!cost.perMinute) return `${cost.credits} quota mỗi lần tạo`;

  const rate = `${cost.credits} quota/phút`;
  if (!hasDuration(durationSec)) return rate;

  const minutes = billableMinutes(durationSec, pricing.maxDurationSec);
  return `${rate} × ${minutes} phút`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Số ngày lịch từ hôm nay tới `d`, theo múi giờ của trình duyệt. */
function daysFromToday(d: Date): number {
  const midnight = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((midnight(d) - midnight(new Date())) / 86_400_000);
}

/**
 * Mốc reset quota thành giờ địa phương: "20:30" (hôm nay) hoặc
 * "08:00 ngày mai". Cửa sổ quota dài 24h nên mốc luôn rơi vào một trong hai
 * trường hợp đó; nhánh cuối chỉ là lưới an toàn.
 *
 * Cố tình hiển thị thời điểm tuyệt đối chứ không phải "còn 5 giờ nữa" — chuỗi
 * đếm ngược sẽ sai dần nếu không refetch, còn mốc giờ thì đứng yên.
 *
 * null (chưa dùng credit nào, cửa sổ chưa bắt đầu) hoặc chuỗi hỏng → "", và
 * mọi nơi gọi đều bỏ luôn phần "reset lúc ..." thay vì hiện mốc bịa.
 */
export function formatResetAt(resetAtIso: string | null): string {
  if (!resetAtIso) return "";

  const reset = new Date(resetAtIso);
  if (Number.isNaN(reset.getTime())) return "";

  const time = `${pad(reset.getHours())}:${pad(reset.getMinutes())}`;
  const days = daysFromToday(reset);
  if (days <= 0) return time;
  if (days === 1) return `${time} ngày mai`;
  return `${time} ${pad(reset.getDate())}/${pad(reset.getMonth() + 1)}`;
}
