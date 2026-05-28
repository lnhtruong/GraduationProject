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
    initialResumePositionSec: data.initialResumePositionSec,
    shouldForceResumeFromQuery: data.shouldForceResumeFromQuery,
    selectedLessonProgressId: data.selectedLessonProgress?.id,
  });

  return {
    ...data,
    ...player,
  };
}
