import { buildPrivatePageMetadata } from "@/lib/metadata";
import InstructorQAWorkspace from "@/features/instructor/components/qa/InstructorQAWorkspace";

export const metadata = buildPrivatePageMetadata(
  "Q&A giảng viên",
  "Quản lý câu hỏi, thảo luận và phản hồi của học viên trên các khóa học.",
);

export default function Page() {
  return <InstructorQAWorkspace />;
}
