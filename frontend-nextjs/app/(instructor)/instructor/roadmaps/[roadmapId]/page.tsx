import RoadmapDetailPage from "@/features/instructor/roadmap-management/RoadmapDetail";

export const metadata = { title: "Chi tiết lộ trình — Teacher Mode" };

interface Props {
  params: Promise<{ roadmapId: string }>;
}

export default async function Page({ params }: Props) {
  const { roadmapId } = await params;
  return <RoadmapDetailPage roadmapId={Number(roadmapId)} />;
}
