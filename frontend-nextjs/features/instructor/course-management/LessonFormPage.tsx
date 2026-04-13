"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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

interface Props {
  courseId: number;
  lessonId?: number;
}

export default function LessonFormPage({ courseId, lessonId }: Props) {
  const router = useRouter();
  const isEdit = lessonId !== undefined;
  const { user } = useAuth();

  const [activityDialogOpen, setActivityDialogOpen] = useState(false);

  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lesson, isLoading: lessonLoading } = useLessonById(
    isEdit ? lessonId : null,
  );

  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();

  if (courseLoading || lessonLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
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
        <div className="p-6 text-sm text-muted-foreground">
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
          {
            label: "Bài học",
            href: `/instructor/courses/${course.id}/lessons`,
          },
          { label: "Chỉnh sửa" },
        ]}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        }
      >
        <div className="p-6 text-sm text-muted-foreground">
          Vui lòng chọn một bài học hợp lệ.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={isEdit ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
      description="Thiết lập nội dung bài học theo đúng thứ tự của khóa học."
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        { label: "Bài học", href: `/instructor/courses/${course.id}/lessons` },
        { label: isEdit ? (lesson?.title ?? "Chỉnh sửa") : "Tạo mới" },
      ]}
      action={
        <div className="flex flex-wrap gap-2">
          {isEdit ? (
            <Button onClick={() => setActivityDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo hoạt động
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      }
    >
      <LessonForm
        lesson={lesson}
        courseId={course.id}
        course={course}
        onSave={async (payload) => {
          if (isEdit && lesson) {
            await updateLessonMutation.mutateAsync({
              id: lesson.id,
              data: payload,
            });
            router.push(`/instructor/courses/${course.id}/lessons`);
            router.refresh();
            return;
          }

          await createLessonMutation.mutateAsync({
            ...payload,
            courseId,
          });
          router.push(`/instructor/courses/${course.id}/lessons`);
          router.refresh();
        }}
      />

      {isEdit && lesson ? (
        <ActivityCreationDialog
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
          courseId={course.id}
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          lessonVideoId={lesson.videoId}
          userId={user?.id}
        />
      ) : null}
    </ManagementPageShell>
  );
}
