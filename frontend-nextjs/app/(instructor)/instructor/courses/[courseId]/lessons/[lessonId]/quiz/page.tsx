import QuizEditorPage from "@/features/instructor/course-management/QuizEditorPage";

export const metadata = { title: "Quiz bài học — Teacher Mode" };

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<{
    activityId?: string;
    lessonActivityId?: string;
    quizId?: string;
    mode?: string;
  }>;
}

export default async function Page({ params, searchParams }: Props) {
  const { courseId, lessonId } = await params;
  const { activityId, lessonActivityId, quizId, mode } = await searchParams;
  const parsedActivityId = Number(activityId ?? lessonActivityId ?? "");
  const parsedQuizId = Number(quizId ?? "");

  return (
    <QuizEditorPage
      courseId={Number(courseId)}
      lessonId={Number(lessonId)}
      initialActivityId={
        parsedActivityId && Number.isFinite(parsedActivityId)
          ? parsedActivityId
          : null
      }
      initialQuizId={
        parsedQuizId && Number.isFinite(parsedQuizId) ? parsedQuizId : null
      }
      initialIsInVideo={mode === "in_video"}
    />
  );
}
