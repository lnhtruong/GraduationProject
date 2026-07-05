import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Tải nội dung lên",
  "Tải và quản lý tài nguyên video, hình ảnh học tập trong LearnHub.",
);

import Upload from "@/features/upload";

export default function UploadPage() {
  return <Upload />;
}
