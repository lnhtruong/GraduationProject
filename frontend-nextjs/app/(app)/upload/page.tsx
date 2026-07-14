import Upload from "@/features/upload";
import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Tạo highlight",
  "Tải video bài giảng lên StudyLoop, tạo highlight và mở Studio để chỉnh sửa.",
);

export default function UploadPage() {
  return <Upload />;
}
