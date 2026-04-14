"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ManagementPageShell } from "./components/ManagementPageShell";
import { QuizEditor } from "./components/QuizEditor";
import {
  useCreateLessonActivity,
  useCreateQuiz,
  useInstructorCourseById,
  useQuizById,
  useLessonActivitiesByLessonId,
  useLessonById,
  useQuizzesByLessonActivityId,
  useUpdateQuiz,
} from "./api/course-management.hooks";
import type { QuizEditorState } from "./types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  buildQuizEditorKey,
  buildQuizEditorState,
  resolveExistingQuiz,
  resolveQuizActivity,
} from "./utils/quiz-editor-page.utils";

interface Props {
  courseId: number;
  lessonId: number;
  initialActivityId?: number | null;
  initialQuizId?: number | null;
  initialIsInVideo?: boolean;
}

export default function QuizEditorPage({
  courseId,
  lessonId,
  initialActivityId = null,
  initialQuizId = null,
  initialIsInVideo = false,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: course, isLoading: courseLoading } =
    useInstructorCourseById(courseId);
  const { data: lesson, isLoading: lessonLoading } = useLessonById(lessonId);
  const { data: lessonActivities, isLoading: activitiesLoading } =
    useLessonActivitiesByLessonId(lessonId);
  const quizActivity = resolveQuizActivity(lessonActivities, initialActivityId);

  const { data: quizById, isLoading: quizByIdLoading } =
    useQuizById(initialQuizId);
  const { data: quizzes, isLoading: quizzesLoading } =
    useQuizzesByLessonActivityId(quizActivity?.id ?? null);
  const createLessonActivityMutation = useCreateLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const updateQuizMutation = useUpdateQuiz();

  if (
    courseLoading ||
    lessonLoading ||
    activitiesLoading ||
    quizzesLoading ||
    quizByIdLoading
  ) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Đang tải quiz...</div>
    );
  }

  if (!course || !lesson) {
    return (
      <ManagementPageShell
        title="Không tìm thấy quiz"
        description="Quiz gắn với bài học này chưa có hoặc id không hợp lệ."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Quiz" },
        ]}
      >
        <div className="p-6 text-sm text-muted-foreground">
          Không thể mở quiz editor.
        </div>
      </ManagementPageShell>
    );
  }

  const existingQuiz = resolveExistingQuiz(initialQuizId, quizById, quizzes);
  const editorState = buildQuizEditorState(
    existingQuiz,
    quizActivity?.id ?? null,
    quizActivity?.description ?? "",
    initialIsInVideo,
  );

  const handleSave = async (state: QuizEditorState) => {
    let lessonActivityId = state.lessonActivityId ?? quizActivity?.id ?? null;

    if (!lessonActivityId) {
      const createdActivity = await createLessonActivityMutation.mutateAsync({
        lessonId,
        activityType: "quiz",
        title: state.title,
        description: state.description,
        orderIndex: 1,
        status: "public",
        createdBy: user?.id,
      });
      lessonActivityId = createdActivity.id;
    }

    const payload = {
      ...state,
      lessonActivityId,
    };

    if (existingQuiz) {
      await updateQuizMutation.mutateAsync({
        id: existingQuiz.id,
        data: payload,
      });
    } else {
      await createQuizMutation.mutateAsync(payload);
    }
  };

  return (
    <ManagementPageShell
      title={`Chỉnh quiz: ${lesson.title}`}
      description="Chỉnh sửa nội dung quiz ngay dưới bài học tương ứng để giữ đúng cấu trúc khóa học."
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: course.name, href: `/instructor/courses/${course.id}` },
        { label: "Bài học", href: `/instructor/courses/${course.id}/lessons` },
        {
          label: lesson.title,
          href: `/instructor/courses/${course.id}/lessons/${lesson.id}/edit`,
        },
        { label: "Quiz" },
      ]}
      action={
        <Button variant="outline" onClick={() => router.back()}>
          Quay lại
        </Button>
      }
    >
      <div className="p-6">
        <QuizEditor
          key={buildQuizEditorKey(
            editorState.lessonActivityId ?? null,
            existingQuiz?.id ?? null,
          )}
          quiz={editorState}
          onSave={handleSave}
        />
      </div>
    </ManagementPageShell>
  );
}
