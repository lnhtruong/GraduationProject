// Nhãn + định dạng hiển thị cho diff của change request — dùng chung giữa
// AdminChangeRequestReviewModal và AdminChangeRequestTable để tránh 2 bản
// FIELD_LABELS lệch nhau theo thời gian.

import { stripHtml } from "@/lib/sanitize-html";

// Field theo course.update, lesson.create/update/delete (kind còn hoạt động).
// Field quiz.* (lessonActivityId, shuffleQuestion, shuffleOption, passingScore,
// timeLimitMinutes, isInVideo, questions) không có ở đây: không còn code nào
// tạo change request quiz.* nữa (đã chuyển sang sửa/xoá quiz trực tiếp), giữ
// nguyên enum backend cho tương thích ngược nhưng không cần format cho FE.
export const FIELD_LABELS: Record<string, string> = {
  name: "Tên khoá học",
  description: "Mô tả",
  price: "Giá (đ)",
  level: "Cấp độ",
  language: "Ngôn ngữ",
  categories: "Danh mục",
  thumbnailUrl: "Ảnh bìa",
  videoId: "Video bài học",
  title: "Tiêu đề bài học",
  contentType: "Loại nội dung",
  duration: "Thời lượng",
  status: "Trạng thái",
  content: "Nội dung bài học",
};

// Field không nên (hoặc không thể) hiển thị dạng chuỗi from/to đơn giản —
// content là JSON object (preview riêng), videoId cần resolve qua API riêng
// để lấy URL nên cũng được render riêng (xem VideoDiffPreview).
export const NON_TEXT_DIFF_FIELDS = new Set(["content", "videoId"]);
export const HIDDEN_DIFF_FIELDS = new Set(["courseId", "targetId", "status"]);

// Field lưu HTML từ trình soạn thảo WYSIWYG — nơi có đủ không gian (modal chi
// tiết) nên render đúng định dạng thay vì strip; formatDiffValue() vẫn strip
// tag cho các chỗ chỉ cần preview dạng text ngắn gọn (bảng danh sách).
export const HTML_DIFF_FIELDS = new Set(["description"]);

const LEVEL_VALUE_LABELS: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Cao cấp",
};

const CONTENT_TYPE_VALUE_LABELS: Record<string, string> = {
  video: "Video",
  text: "Văn bản",
};

const LESSON_STATUS_VALUE_LABELS: Record<string, string> = {
  active: "Hoạt động",
  removed: "Đã xoá",
  blocked: "Bị chặn",
};

const LANGUAGE_VALUE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
};

// Field dạng enum: map giá trị enum thô (backend) sang nhãn tiếng Việt.
const ENUM_VALUE_LABELS: Record<string, Record<string, string>> = {
  level: LEVEL_VALUE_LABELS,
  contentType: CONTENT_TYPE_VALUE_LABELS,
  status: LESSON_STATUS_VALUE_LABELS,
  language: LANGUAGE_VALUE_LABELS,
};

/** Định dạng 1 giá trị field cho hiển thị diff, tuỳ theo kiểu dữ liệu thực tế. */
export function formatDiffValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.map((v) => (typeof v === "string" ? v : String(v))).join(", ");
  }

  if (typeof value === "object") {
    // content/questions là JSON phức tạp — không cố String() thành "[object Object]".
    return null;
  }

  const enumLabels = ENUM_VALUE_LABELS[field];
  if (enumLabels) {
    return enumLabels[String(value).toLowerCase()] ?? String(value);
  }

  if (field === "price") {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toLocaleString("vi-VN")}đ` : String(value);
  }

  if (HTML_DIFF_FIELDS.has(field)) {
    const text = stripHtml(String(value));
    return text.length > 0 ? text : null;
  }

  return String(value);
}

function parseDurationToMilliseconds(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 1000));
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,3}):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const millis = Number((match[4] ?? "0").padEnd(3, "0"));
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric * 1000)) : null;
}

function normalizeJsonDiffValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonDiffValue);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeJsonDiffValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value ?? null;
}

function normalizeComparableDiffValue(field: string, value: unknown): unknown {
  if (value === undefined) return null;
  if (field === "duration") return parseDurationToMilliseconds(value);
  if (field === "courseId" || field === "videoId" || field === "targetId") {
    return value === null || value === undefined || value === "" ? null : Number(value);
  }
  if (["contentType", "status", "level", "language"].includes(field)) {
    return typeof value === "string" ? value.trim().toLowerCase() : value ?? null;
  }
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return normalizeJsonDiffValue(value);
  }
  return value ?? null;
}

export function isMeaningfulDiff(field: string, from: unknown, to: unknown): boolean {
  if (HIDDEN_DIFF_FIELDS.has(field)) return false;
  return JSON.stringify(normalizeComparableDiffValue(field, from)) !== JSON.stringify(normalizeComparableDiffValue(field, to));
}

export function getDisplayChangeDiffs<T extends { field: string; from: unknown; to: unknown }>(diffs?: T[] | null): T[] {
  return (diffs ?? []).filter((diff) => isMeaningfulDiff(diff.field, diff.from, diff.to));
}
