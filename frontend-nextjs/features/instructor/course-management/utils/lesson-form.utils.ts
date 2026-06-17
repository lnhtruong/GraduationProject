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
  const safe = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = safe % 60;

  if (hh > 0) {
    return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
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
