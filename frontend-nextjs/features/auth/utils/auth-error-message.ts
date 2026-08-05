const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "User with this email already exists": "Email này đã được sử dụng.",
  "Invalid account or password!": "Email hoặc mật khẩu không đúng.",
  "Invalid Google account": "Tài khoản Google không hợp lệ.",
  "Google email is not verified": "Email Google của bạn chưa được xác minh.",
  "Invalid Google token": "Phiên đăng nhập Google không hợp lệ. Vui lòng thử lại.",
  "Invalid OAuth state": "Phiên đăng nhập bên thứ ba đã hết hạn. Vui lòng thử lại.",
  "Failed to get GitHub access token": "Không thể đăng nhập bằng GitHub. Vui lòng thử lại.",
  "Failed to get Facebook access token": "Không thể đăng nhập bằng Facebook. Vui lòng thử lại.",
  "GitHub OAuth is not configured": "Đăng nhập GitHub chưa được cấu hình.",
  "Facebook OAuth is not configured": "Đăng nhập Facebook chưa được cấu hình.",
  "Missing session": "Phiên đăng nhập không hợp lệ. Vui lòng thử lại.",
  "Session expired or invalid": "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.",
  "Session expired": "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.",
  "User account is banned": "Tài khoản của bạn đã bị khóa.",
  "No token provided": "Bạn cần đăng nhập để tiếp tục.",
  "Invalid authorization header format": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "Invalid or expired token": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Authentication error": "Không thể xác thực phiên đăng nhập. Vui lòng thử lại.",
  "Token not provided": "Bạn cần đăng nhập để tiếp tục.",
  "Invalid token": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "Refresh token not found": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Invalid refresh token": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Refresh token not found or expired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "Refresh token reuse detected": "Phiên đăng nhập không an toàn. Vui lòng đăng nhập lại.",
  "User not found": "Không tìm thấy tài khoản.",
  "Logged out successfully": "Đăng xuất thành công.",
};

const QUERY_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Đăng nhập bên thứ ba thất bại. Vui lòng thử lại.",
  login_failed: "Đăng nhập bên thứ ba thất bại. Vui lòng thử lại.",
  session_expired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

function readBackendMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("response" in error)) return;

  const response = (error as {
    response?: { data?: { message?: string | string[]; error?: string } };
  }).response;
  const message = response?.data?.message;

  if (Array.isArray(message)) return message[0];
  return message ?? response?.data?.error;
}

function translateMessage(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  return AUTH_ERROR_MESSAGES[message] ?? message;
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  const backendMessage = readBackendMessage(error);
  if (backendMessage) return translateMessage(backendMessage, fallback);
  if (error instanceof Error) return translateMessage(error.message, fallback);
  return fallback;
}

export function getAuthQueryErrorMessage(error: string | null) {
  if (!error) return "";
  return QUERY_ERROR_MESSAGES[error] ?? "Đăng nhập thất bại. Vui lòng thử lại.";
}
