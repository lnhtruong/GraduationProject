import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Q&A khóa học",
  "Theo dõi và phản hồi thảo luận của học viên trong khóa học.",
);

import { use, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseQAWorkspace } from "@/features/instructor/qa/components/CourseQAWorkspace";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default function Page({ params }: Props) {
  const { courseId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      }
    >
      <CourseQAWorkspace courseId={Number(courseId)} />
    </Suspense>
  );
}
