import { buildPrivatePageMetadata } from "@/lib/metadata";
import OAuthCallbackPage from "./OAuthCallbackClient";

export const metadata = buildPrivatePageMetadata(
  "Đang đăng nhập",
  "Hoàn tất đăng nhập OAuth và đồng bộ phiên truy cập LearnHub.",
);

export default function Page() {
  return <OAuthCallbackPage />;
}
