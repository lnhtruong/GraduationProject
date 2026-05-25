import { NextResponse } from "next/server";

// Proxy không thể đọc refreshToken cookie vì backend set cookie với
// sameSite: 'none', secure: true (cross-origin giữa localhost và ngrok/production).
// Browser chỉ gửi secure cookie trên HTTPS — Next.js proxy chạy trên server
// không nhận được cookie này khi frontend là HTTP localhost.
//
// Route protection được thực hiện hoàn toàn ở client-side:
//   - /admin/*     → AdminShell (kiểm tra role === ADMIN, redirect /unauthorized)
//   - /instructor/* → ProtectedRoute (kiểm tra role, redirect /signin)
// API gateway enforce authorization trên mọi API call server-side.

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
