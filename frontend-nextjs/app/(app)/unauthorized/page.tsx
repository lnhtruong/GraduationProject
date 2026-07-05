import { buildPrivatePageMetadata } from "@/lib/metadata";
import UnauthorizedClient from "./UnauthorizedClient";

export const metadata = buildPrivatePageMetadata(
  "Không có quyền truy cập",
  "Trang thông báo khi tài khoản không có quyền truy cập nội dung yêu cầu.",
);

export default function Page() {
  return <UnauthorizedClient />;
}
