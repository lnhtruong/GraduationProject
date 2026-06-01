import { useCourseLearnData } from "./useCourseLearnData";
import { useCourseLearnPlayer } from "./useCourseLearnPlayer";

export function useCourseLearnPage(courseId: number) {
  const data = useCourseLearnData(courseId);

  const player = useCourseLearnPlayer({
    selectedLesson: data.selectedLesson,
    selectedLessonDuration: data.selectedLessonDuration,
    inVideoQuizPoints: data.inVideoQuizPoints,
    afterLessonQuiz: data.afterLessonQuiz,
    nextLesson: data.nextLesson,
    lessons: data.lessons,
    onSelectLesson: data.handleSelectLesson,
    onMarkLessonCompleted: data.markLessonCompleted,
    onHeartbeat: data.sendHeartbeat,
    onSubmitQuizAttempt: data.submitQuizAttempt,
    initialResumePositionSec: data.initialResumePositionSec,
    selectedLessonProgressId: data.selectedLessonProgress?.id,
    persistedInVideoAnswers: data.persistedInVideoState.answers,
    persistedInVideoSubmitted: data.persistedInVideoState.submitted,
    persistedAfterLessonAnswers: data.persistedAfterLessonState.answers,
    persistedAfterLessonSubmitted: data.persistedAfterLessonState.submitted,
  });

  return {
    ...data,
    ...player,
  };
}
