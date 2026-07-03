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
