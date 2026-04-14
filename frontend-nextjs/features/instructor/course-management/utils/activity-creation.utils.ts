import type { QuizEditorState } from "../types";

/**
 * Generate video timestamp options at regular intervals
 * @param duration Video duration in seconds
 * @param step Interval between timestamps in seconds (default: 15)
 * @returns Array of HH:MM:SS.000 formatted timestamps
 */
export function generateTimestampOptions(
  duration: number,
  step: number = 15,
): string[] {
  const validDuration = Math.max(0, duration);
  if (!validDuration) {
    return [];
  }

  const toTimestamp = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.000`;
  };

  const values: string[] = [];
  for (let t = 0; t <= validDuration; t += step) {
    values.push(toTimestamp(t));
  }

  // Ensure last timestamp matches exact duration
  if (values[values.length - 1] !== toTimestamp(validDuration)) {
    values.push(toTimestamp(validDuration));
  }

  return values;
}

/**
 * Check if in-video quiz can be created
 * @param hasVideoId Whether lesson has a video ID
 * @param timestampOptionsLength Number of available timestamps
 * @returns Whether in-video quiz creation is possible
 */
export function canCreateInVideoQuiz(
  hasVideoId: boolean,
  timestampOptionsLength: number,
): boolean {
  return hasVideoId && timestampOptionsLength > 0;
}

/**
 * Build assignment creation payload
 * @param lessonId ID of the lesson
 * @param title Assignment title
 * @param lessonTitle Default title fallback
 * @param nextOrderIndex Order for the activity
 * @param userId User creating the assignment
 * @returns Assignment payload for API
 */
export function createAssignmentPayload(
  lessonId: number,
  title: string,
  lessonTitle: string,
  nextOrderIndex: number,
  userId?: number,
) {
  return {
    lessonId,
    activityType: "assignment" as const,
    title: title.trim() || `Bài tập: ${lessonTitle}`,
    description: "Activity bài tập",
    orderIndex: nextOrderIndex,
    status: "draft" as const,
    createdBy: userId,
  };
}

/**
 * Build quiz payload with video timestamp handling
 * @param state Quiz editor state
 * @param lessonActivityId ID of created lesson activity
 * @param quizMode Quiz mode (in_video or outside_video)
 * @param quizTimestamp Default timestamp for in-video quiz
 * @returns Quiz payload for API
 */
export function createQuizPayload(
  state: QuizEditorState,
  lessonActivityId: number,
  quizMode: "in_video" | "outside_video",
  quizTimestamp: string,
): QuizEditorState {
  return {
    ...state,
    lessonActivityId,
    isInVideo: quizMode === "in_video",
    questions:
      quizMode === "in_video"
        ? state.questions.map((question) => ({
            ...question,
            videoTimestamp: question.videoTimestamp || quizTimestamp,
          }))
        : state.questions.map((question) => ({
            ...question,
            videoTimestamp: "",
          })),
  };
}
