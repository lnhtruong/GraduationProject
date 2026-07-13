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

// Field dạng enum: map giá trị enum thô (backend) sang nhãn tiếng Việt.
const ENUM_VALUE_LABELS: Record<string, Record<string, string>> = {
  level: LEVEL_VALUE_LABELS,
  contentType: CONTENT_TYPE_VALUE_LABELS,
  status: LESSON_STATUS_VALUE_LABELS,
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
