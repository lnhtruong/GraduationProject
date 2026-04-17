import {
  createResourceApi,
  type PaginatedResponse,
  withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
  InstructorRoadmap,
  InstructorRoadmapCourse,
  RoadmapCourseFormValues,
  RoadmapFormValues,
} from "../types";

export type RoadmapListParams = {
  userId?: number;
  page?: number;
  limit?: number;
  search?: string;
};

export type RoadmapListResponse = {
  data?: InstructorRoadmap[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export type RoadmapPaginatedResult = PaginatedResponse<InstructorRoadmap>;

const roadmapCrudApi = createResourceApi<
  InstructorRoadmap,
  InstructorRoadmap,
  RoadmapFormValues,
  RoadmapFormValues,
  number,
  RoadmapListParams,
  { message?: string },
  RoadmapListResponse | InstructorRoadmap[]
>({
  basePath: "/course/roadmaps",
  mapItem: (item) => item,
  mapListResponse: (raw) => (Array.isArray(raw) ? raw : (raw.data ?? [])),
  getListPath: (params) => withQueryPath("/course/roadmaps", params),
});

export const roadmapApi = roadmapCrudApi;

type RoadmapCourseCreatePayload = {
  roadmapId: number;
  data: RoadmapCourseFormValues;
};

type RoadmapCourseId = string;

function buildRoadmapCourseKey(roadmapId: number, courseId: number): string {
  return `${roadmapId}:${courseId}`;
}

function parseRoadmapCourseKey(key: string): {
  roadmapId: number;
  courseId: number;
} {
  const [rawRoadmapId, rawCourseId] = key.split(":");
  return {
    roadmapId: Number(rawRoadmapId),
    courseId: Number(rawCourseId),
  };
}

const roadmapCourseCrudApi = createResourceApi<
  InstructorRoadmapCourse,
  InstructorRoadmapCourse,
  RoadmapCourseCreatePayload,
  RoadmapCourseFormValues,
  RoadmapCourseId,
  unknown,
  void
>({
  basePath: "/course/roadmaps",
  mapItem: (item) => item,
  toCreatePayload: (payload) => payload.data,
  getCreatePath: (payload) => `/course/roadmaps/${payload.roadmapId}/courses`,
  getOnePath: (id) => {
    const parsed = parseRoadmapCourseKey(id);
    return `/course/roadmaps/${parsed.roadmapId}/courses/${parsed.courseId}`;
  },
  getUpdatePath: (id) => {
    const parsed = parseRoadmapCourseKey(id);
    return `/course/roadmaps/${parsed.roadmapId}/courses/${parsed.courseId}`;
  },
  getDeletePath: (id) => {
    const parsed = parseRoadmapCourseKey(id);
    return `/course/roadmaps/${parsed.roadmapId}/courses/${parsed.courseId}`;
  },
});

export const roadmapCourseApi = {
  addCourse: (roadmapId: number, data: RoadmapCourseFormValues) =>
    roadmapCourseCrudApi.create({ roadmapId, data }),
  updateCourse: (
    roadmapId: number,
    courseId: number,
    data: RoadmapCourseFormValues,
  ) =>
    roadmapCourseCrudApi.update(
      buildRoadmapCourseKey(roadmapId, courseId),
      data,
    ),
  removeCourse: (roadmapId: number, courseId: number) =>
    roadmapCourseCrudApi.delete(buildRoadmapCourseKey(roadmapId, courseId)),
};

export type { RoadmapCourseFormValues, RoadmapFormValues };
