"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagementPageShell } from "./components/ManagementPageShell";
import { LessonForm } from "./components/LessonForm";
import { ActivityCreationDialog } from "./components/ActivityCreationDialog";
import {
  useCreateLesson,
  useInstructorCourseById,
  useLessonById,
  useUpdateLesson,
} from "./api/course-management.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { LessonFormVideoContext } from "./utils/draft-video.utils";

interface Props {
  courseId: number;
  lessonId?: number;
}

export default function LessonFormPage({ courseId, lessonId }: Props) {
  const router = useRouter();
  const isEdit = lessonId !== undefined;
  const { user } = useAuth();

  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [videoContext, setVideoContext] = useState<LessonFormVideoContext>({
    selectedVideoId: null,
    draftVideoBlobUrl: null,
    draftVideoDurationSeconds: 0,
  });

  const handleVideoContextChange = useCallback(
    (context: LessonFormVideoContext) => {
      setVideoContext(context);
    },
    [],
  );

  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lesson, isLoading: lessonLoading } = useLessonById(
    isEdit ? lessonId : null,
  );

  const activeLessonVideoId =
    videoContext.selectedVideoId ?? lesson?.videoId ?? null;

  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();

  if (courseLoading || lessonLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground sm:p-5">
        Đang tải bài học...
      </div>
    );
  }

  if (!course) {
    return (
      <ManagementPageShell
        title="Không tìm thấy khóa học"
        description="Khóa học gốc không tồn tại, nên không thể tạo hoặc sửa bài học."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Bài học" },
        ]}
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Khóa học không hợp lệ.
        </div>
      </ManagementPageShell>
    );
  }

  if (isEdit && !lesson) {
    return (
      <ManagementPageShell
        title="Không tìm thấy bài học"
        description="Bài học bạn muốn chỉnh sửa không tồn tại trong khóa học này."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: course.name, href: `/instructor/courses/${course.id}` },
          { label: "Chỉnh sửa bài học" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        }
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Vui lòng chọn một bài học hợp lệ.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={isEdit ? (lesson?.title || "Bài học") : "Tạo bài học mới"}
      noCard
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        { label: isEdit ? (lesson?.title || "Bài học") : "Tạo mới bài học" },
      ]}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {isEdit ? (
            <Button
              onClick={() => setActivityDialogOpen(true)}
              variant="outline"
              className="h-10 text-xs font-semibold rounded-xl border-primary text-primary hover:bg-primary/5 hover:text-primary gap-1.5 shadow-sm transition-all"
            >
              <NotebookText className="h-4 w-4 text-primary" />
              Tạo hoạt động
            </Button>
          ) : null}

          <div id="lesson-form-actions-portal" className="flex items-center gap-2" />
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-10 text-xs font-semibold rounded-xl gap-1.5 shadow-sm transition-all"
          >
            Quay lại
          </Button>
        </div>
      }
    >
      <LessonForm
        lesson={lesson}
        courseId={course.id}
        course={course}
        onVideoContextChange={handleVideoContextChange}
        onSave={async (payload) => {
          if (isEdit && lesson) {
            await updateLessonMutation.mutateAsync({
              id: lesson.id,
              data: payload,
            });
            return lesson.id;
          }

          const created = await createLessonMutation.mutateAsync({
            ...payload,
            courseId,
          });
          return created.id;
        }}
        onSaved={() => {
          router.push(`/instructor/courses/${course.id}`);
          router.refresh();
        }}
      />

      {isEdit && lesson ? (
        <ActivityCreationDialog
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          lessonVideoId={activeLessonVideoId}
          draftVideoBlobUrl={videoContext.draftVideoBlobUrl}
          draftVideoDurationSeconds={videoContext.draftVideoDurationSeconds}
          userId={user?.id}
        />
      ) : null}
    </ManagementPageShell>
  );
}
