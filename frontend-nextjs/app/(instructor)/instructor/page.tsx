import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Khu vực giảng viên",
  "Quản lý khóa học, học viên và nội dung giảng dạy trên StudyLoop.",
);

import { redirect } from "next/navigation";

export default function InstructorIndexPage() {
  redirect("/instructor/dashboard");
}
