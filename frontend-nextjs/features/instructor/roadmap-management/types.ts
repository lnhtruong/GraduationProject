import type { InstructorCourse } from "../course-management/types";

export type RoadmapCourseStatus = "null" | "learning" | "finish";

export interface InstructorRoadmapCourse {
  id: number;
  roadmapId?: number | null;
  courseId?: number | null;
  orderIndex?: number | null;
  stepNumber?: number | null;
  phaseName?: string | null;
  status?: RoadmapCourseStatus | null;
  course?: InstructorCourse;
}

export interface InstructorRoadmapStep {
  id?: number | null;
  name?: string | null;
  orderIndex?: number | null;
  courses?: InstructorRoadmapCourse[];
}

export interface InstructorRoadmap {
  id: number;
  userId?: number | null;
  name: string;
  description?: string | null;
  totalCourses?: number | null;
  progress?: number | null;
  roadmapCourses?: InstructorRoadmapCourse[];
  steps?: InstructorRoadmapStep[];
}

export interface RoadmapFormValues {
  userId?: number | null;
  name: string;
  description?: string | null;
}

export interface RoadmapCourseFormValues {
  courseId: number;
  orderIndex?: number;
  status?: RoadmapCourseStatus | null;
}
