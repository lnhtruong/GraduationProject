import { buildPageMetadata } from "@/lib/metadata";
import SearchCoursesPage from "./SearchCoursesClient";

export const metadata = buildPageMetadata({
  title: "Tìm kiếm khóa học",
  description: "Tìm kiếm và lọc khóa học theo chủ đề, cấp độ, giá và đánh giá trên LearnHub.",
  path: "/courses/search",
});

export default function Page() {
  return <SearchCoursesPage />;
}
