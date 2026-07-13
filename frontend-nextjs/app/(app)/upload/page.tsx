import Upload from "@/features/upload";
import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Tạo highlight",
  "Tải video bài giảng lên LearnHub, tạo highlight và mở Studio để thêm Mascot.",
);

export default function UploadPage() {
  return <Upload />;
}
