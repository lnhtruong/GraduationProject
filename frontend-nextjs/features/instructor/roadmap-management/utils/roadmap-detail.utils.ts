import type { InstructorRoadmapCourse } from "../types";

export interface BuildRoadmapChangeSetInput {
  initialRoadmapCourses: InstructorRoadmapCourse[];
  roadmapCourses: InstructorRoadmapCourse[];
  roadmapName?: string | null;
  roadmapDescription?: string | null;
  name: string;
  description: string;
}

export interface RoadmapChangeSet {
  normalizedName: string;
  normalizedDescription: string;
  hasRoadmapInfoChanged: boolean;
  hasCourseOrderChanged: boolean;
  hasCourseListChanged: boolean;
  removedCourseIds: number[];
  addedCourses: InstructorRoadmapCourse[];
}

function toValidCourseIds(courses: InstructorRoadmapCourse[]): number[] {
  return courses
    .map((item) => item.courseId)
    .filter((courseId): courseId is number => typeof courseId === "number");
}

export function buildRoadmapChangeSet({
  initialRoadmapCourses,
  roadmapCourses,
  roadmapName,
  roadmapDescription,
  name,
  description,
}: BuildRoadmapChangeSetInput): RoadmapChangeSet {
  const initialCourseIds = toValidCourseIds(initialRoadmapCourses);
  const draftCourseIds = toValidCourseIds(roadmapCourses);

  const removedCourseIds = initialCourseIds.filter(
    (courseId) => !draftCourseIds.includes(courseId),
  );

  const addedCourses = roadmapCourses.filter(
    (item) =>
      typeof item.courseId === "number" &&
      !initialCourseIds.includes(item.courseId),
  );

  const normalizedName = name.trim();
  const normalizedDescription = description.trim();
  const initialName = (roadmapName ?? "").trim();
  const initialDescription = (roadmapDescription ?? "").trim();

  const hasRoadmapInfoChanged =
    normalizedName !== initialName ||
    normalizedDescription !== initialDescription;

  const initialOrderSignature = initialRoadmapCourses
    .map((item) => item.courseId)
    .join(",");
  const draftOrderSignature = roadmapCourses
    .map((item) => item.courseId)
    .join(",");

  const hasCourseOrderChanged = initialOrderSignature !== draftOrderSignature;
  const hasCourseListChanged =
    removedCourseIds.length > 0 ||
    addedCourses.length > 0 ||
    hasCourseOrderChanged;

  return {
    normalizedName,
    normalizedDescription,
    hasRoadmapInfoChanged,
    hasCourseOrderChanged,
    hasCourseListChanged,
    removedCourseIds,
    addedCourses,
  };
}

export function hasRoadmapUnsavedChanges(
  input: BuildRoadmapChangeSetInput,
): boolean {
  const { hasRoadmapInfoChanged, hasCourseListChanged } =
    buildRoadmapChangeSet(input);
  return hasRoadmapInfoChanged || hasCourseListChanged;
}
