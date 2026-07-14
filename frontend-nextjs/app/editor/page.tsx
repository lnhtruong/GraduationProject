import { buildPrivatePageMetadata } from "@/lib/metadata";
import Editor from "@/features/editor";

export const metadata = buildPrivatePageMetadata(
  "Trình chỉnh sửa video",
  "Chỉnh sửa video học tập, mascot và tài nguyên sáng tạo trong StudyLoop.",
);

export default function Page() {
  return <Editor />;
}
