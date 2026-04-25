import type { InstructorCourse, InstructorLesson } from "../types";

/**
 * Format seconds into MM:SS or HH:MM:SS format
 * @param seconds Duration in seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) {
    return "--:--";
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Build initial values for lesson form
 * @param courseId Course ID
 * @param lesson Existing lesson or null for new
 * @returns Initial form values
 */
export function buildInitialLessonValues(
  courseId: number,
  lesson?: InstructorLesson | null,
) {
  return {
    courseId,
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    contentType: lesson?.contentType ?? "video",
    duration: lesson?.duration ?? 0,
    content: lesson?.content ?? { summary: "" },
    videoId: lesson?.videoId ?? null,
  };
}

/**
 * Format video card content
 * @param title Video title
 * @param videoId Fallback ID for display
 * @returns Formatted title for display
 */
export function getVideoCardTitle(
  title?: string | null,
  videoId?: number,
): string {
  return title?.trim() || `Video #${videoId}`;
}

/**
 * Check if lesson is in edit mode
 * @param lesson Lesson object
 * @returns Whether lesson is being edited
 */
export function isLessonEditMode(lesson?: InstructorLesson | null): boolean {
  return Boolean(lesson);
}
