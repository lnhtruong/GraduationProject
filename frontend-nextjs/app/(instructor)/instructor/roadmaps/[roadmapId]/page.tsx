import { buildPrivatePageMetadata } from "@/lib/metadata";
import RoadmapDetailPage from "@/features/instructor/roadmap-management/RoadmapDetail";

export const metadata = buildPrivatePageMetadata(
  "Chi tiết lộ trình",
  "Xem và quản lý chi tiết lộ trình học tập.",
);

interface Props {
  params: Promise<{ roadmapId: string }>;
}

export default async function Page({ params }: Props) {
  const { roadmapId } = await params;
  return <RoadmapDetailPage roadmapId={Number(roadmapId)} />;
}
