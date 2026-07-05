import { buildPrivatePageMetadata } from "@/lib/metadata";
import RoadmapCreatePage from "@/features/instructor/roadmap-management/RoadmapCreate";

export const metadata = buildPrivatePageMetadata(
  "Tạo lộ trình",
  "Tạo lộ trình học tập mới và gắn khóa học phù hợp.",
);

export default function Page() {
  return <RoadmapCreatePage />;
}
