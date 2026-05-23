import type { Metadata } from "next";
import { BrowseCoursesPage } from "@/features/courses/components/BrowseCoursesPage";

export const metadata: Metadata = {
  title: "Khoá học — LearnHub",
  description: "Khám phá và tìm kiếm các khoá học AI phù hợp với bạn",
};

export default function CoursesPage() {
  return <BrowseCoursesPage />;
}
