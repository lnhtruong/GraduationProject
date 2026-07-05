import { buildPrivatePageMetadata } from "@/lib/metadata";
import RoadmapListPage from "@/features/instructor/roadmap-management/RoadmapList";

export const metadata = buildPrivatePageMetadata(
  "Lộ trình giảng viên",
  "Quản lý các lộ trình học tập định hướng cho học viên.",
);

export default function Page() {
  return <RoadmapListPage />;
}
