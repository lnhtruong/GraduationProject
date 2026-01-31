import { Suspense } from "react";
import VideoEditor from "@/features/videoEditor";
import { PageLoader } from "@/components/PageLoader";

export default function VideoEditorPage() {
  return (
    <Suspense fallback={<PageLoader message="Đang tải trình chỉnh sửa..." />}>
      <VideoEditor />
    </Suspense>
  );
}
