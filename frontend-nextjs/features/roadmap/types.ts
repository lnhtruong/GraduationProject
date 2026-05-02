import type { Course } from "@/features/courses/types";

export type RoadmapCourseStatus = "null" | "learning" | "finish";

export interface RoadmapCourse {
	id: number;
	roadmapId?: number | null;
	courseId?: number | null;
	orderIndex?: number | null;
	status?: RoadmapCourseStatus | null;
	course?: Course;
}

export interface Roadmap {
	id: number;
	userId?: number | null;
	name: string;
	description?: string | null;
	totalCourses?: number | null;
	progress?: number | null;
	roadmapCourses?: RoadmapCourse[];
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

export interface AddManyRoadmapCoursesPayload {
	courses: RoadmapCourseFormValues[];
}

export interface ReorderRoadmapCoursesPayload {
	courseIds: number[];
}

export interface RoadmapListParams {
	userId?: number;
	page?: number;
	limit?: number;
}
