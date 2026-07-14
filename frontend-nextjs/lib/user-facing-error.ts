import axios from "axios";

const TECHNICAL_MESSAGE_PATTERNS = [
  /request failed/i,
  /status code/i,
  /network error/i,
  /timeout/i,
  /econn/i,
  /socket/i,
  /service unavailable/i,
  /internal server error/i,
  /bad gateway/i,
  /gateway timeout/i,
  /html/i,
  /syntaxerror/i,
  /unexpected token/i,
  /failed to fetch/i,
];

function isTechnicalMessage(message: string) {
  const normalized = message.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.length > 180) {
    return true;
  }

  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function pickResponseMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const message = record.message ?? record.error;

  if (Array.isArray(message)) {
    const joined = message.filter((item) => typeof item === "string").join(". ");
    return joined.trim() || null;
  }

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return null;
}

function getStatusMessage(status?: number) {
  switch (status) {
    case 400:
    case 422:
      return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.";
    case 401:
      return "Bạn cần đăng nhập để tiếp tục.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy nội dung này.";
    case 409:
      return "Nội dung này đã tồn tại hoặc đang bị trùng.";
    case 429:
      return "Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Máy chủ đang bận hoặc tạm thời gián đoạn. Vui lòng thử lại sau.";
    default:
      return null;
  }
}

export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.",
) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseMessage = pickResponseMessage(error.response?.data);

    if (responseMessage && !isTechnicalMessage(responseMessage)) {
      return responseMessage;
    }

    return getStatusMessage(status) ?? fallback;
  }

  if (error instanceof Error && error.message.trim() && !isTechnicalMessage(error.message)) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim() && !isTechnicalMessage(error)) {
    return error.trim();
  }

  return fallback;
}
