import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { createCrudHooks } from "@/features/_shared/crud-factories";
import { createMutationHooks } from "@/features/_shared/react-query-factories";
import {
  roadmapApi,
  roadmapCourseApi,
  type RoadmapListParams,
} from "./roadmap-management.api";
import type {
  InstructorRoadmap,
  InstructorRoadmapCourse,
  RoadmapCourseFormValues,
  RoadmapFormValues,
} from "../types";

const roadmapFeature = "instructor-roadmap-management";
export const roadmapKeys = createKeyFactory(roadmapFeature);

export const roadmapHooks = createCrudHooks<
  InstructorRoadmap,
  RoadmapFormValues,
  RoadmapFormValues,
  number,
  number,
  RoadmapListParams,
  { message?: string }
>(roadmapFeature, roadmapApi, {
  listStaleTimeMs: 30 * 1000,
  detailStaleTimeMs: 15 * 1000,
});

export const {
  useList: useInstructorRoadmaps,
  useDetail: useInstructorRoadmapById,
  useCreate: useCreateRoadmap,
  useUpdate: useUpdateRoadmap,
  useDelete: useDeleteRoadmap,
} = roadmapHooks;

export function useInstructorRoadmapsPaginated(
  params?: RoadmapListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: roadmapKeys.custom(
      "paginated",
      params?.userId,
      params?.page,
      params?.limit,
      params?.search ?? "",
    ),
    queryFn: async () => {
      if (roadmapApi.listPaginated) {
        return roadmapApi.listPaginated(params);
      }

      const items = roadmapApi.list ? await roadmapApi.list(params) : [];
      return {
        data: items,
        pagination: {
          page: params?.page ?? 1,
          limit: params?.limit ?? items.length,
          totalItems: items.length,
          totalPages: 1,
        },
      };
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

type PaginatedRoadmapResult = {
  data: InstructorRoadmap[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

type UpdateRoadmapCourseVariables = {
  roadmapId: number;
  courseId: number;
  data: RoadmapCourseFormValues;
};

type UpdateRoadmapCourseContext = {
  previousRootQueries: Array<[readonly unknown[], unknown]>;
};

type AddRoadmapCourseVariables = {
  roadmapId: number;
  data: RoadmapCourseFormValues;
};

type RemoveRoadmapCourseVariables = {
  roadmapId: number;
  courseId: number;
};

function sortRoadmapCoursesByOrder(
  courses: InstructorRoadmapCourse[] | undefined,
): InstructorRoadmapCourse[] | undefined {
  if (!courses) return courses;
  return [...courses].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

function patchRoadmapCourseInRoadmap(
  roadmap: InstructorRoadmap,
  variables: UpdateRoadmapCourseVariables,
): InstructorRoadmap {
  const nextRoadmapCourses = roadmap.roadmapCourses?.map((roadmapCourse) => {
    if (roadmapCourse.courseId !== variables.courseId) {
      return roadmapCourse;
    }

    return {
      ...roadmapCourse,
      orderIndex: variables.data.orderIndex ?? roadmapCourse.orderIndex,
      status:
        variables.data.status !== undefined
          ? variables.data.status
          : roadmapCourse.status,
      courseId: variables.data.courseId ?? roadmapCourse.courseId,
    };
  });

  return {
    ...roadmap,
    roadmapCourses: sortRoadmapCoursesByOrder(nextRoadmapCourses),
  };
}

function patchRoadmapCourseAcrossCache(
  queryClient: QueryClient,
  variables: UpdateRoadmapCourseVariables,
) {
  const rootQueries = queryClient.getQueriesData({
    queryKey: roadmapKeys.root,
  });

  rootQueries.forEach(([queryKey, currentData]) => {
    if (!currentData) return;

    if (Array.isArray(currentData)) {
      const nextData = (currentData as InstructorRoadmap[]).map((roadmap) =>
        roadmap.id === variables.roadmapId
          ? patchRoadmapCourseInRoadmap(roadmap, variables)
          : roadmap,
      );

      queryClient.setQueryData(queryKey, nextData);
      return;
    }

    const maybePaginated = currentData as PaginatedRoadmapResult;
    if (Array.isArray(maybePaginated.data)) {
      queryClient.setQueryData(queryKey, {
        ...maybePaginated,
        data: maybePaginated.data.map((roadmap) =>
          roadmap.id === variables.roadmapId
            ? patchRoadmapCourseInRoadmap(roadmap, variables)
            : roadmap,
        ),
      });
      return;
    }

    const maybeDetail = currentData as InstructorRoadmap;
    if (maybeDetail?.id === variables.roadmapId) {
      queryClient.setQueryData(
        queryKey,
        patchRoadmapCourseInRoadmap(maybeDetail, variables),
      );
    }
  });

  return rootQueries;
}

function patchAddRoadmapCourseInRoadmap(
  roadmap: InstructorRoadmap,
  variables: AddRoadmapCourseVariables,
  optimisticCourse?: InstructorRoadmapCourse,
): InstructorRoadmap {
  const courses = roadmap.roadmapCourses ?? [];
  const existed = courses.some(
    (roadmapCourse) => roadmapCourse.courseId === variables.data.courseId,
  );

  if (existed) {
    return roadmap;
  }

  const maxOrder = courses.reduce(
    (maxValue, roadmapCourse) =>
      Math.max(maxValue, roadmapCourse.orderIndex ?? 0),
    0,
  );

  const nextCourse: InstructorRoadmapCourse = optimisticCourse ?? {
    id: -Date.now(),
    roadmapId: variables.roadmapId,
    courseId: variables.data.courseId,
    orderIndex: variables.data.orderIndex ?? maxOrder + 1,
    status: variables.data.status ?? "null",
  };

  return {
    ...roadmap,
    roadmapCourses: sortRoadmapCoursesByOrder([...courses, nextCourse]),
  };
}

function patchRemoveRoadmapCourseInRoadmap(
  roadmap: InstructorRoadmap,
  variables: RemoveRoadmapCourseVariables,
): InstructorRoadmap {
  const courses = roadmap.roadmapCourses ?? [];

  return {
    ...roadmap,
    roadmapCourses: courses.filter(
      (roadmapCourse) => roadmapCourse.courseId !== variables.courseId,
    ),
  };
}

function patchAllRoadmapCaches(
  queryClient: QueryClient,
  roadmapId: number,
  patcher: (roadmap: InstructorRoadmap) => InstructorRoadmap,
) {
  const rootQueries = queryClient.getQueriesData({
    queryKey: roadmapKeys.root,
  });

  rootQueries.forEach(([queryKey, currentData]) => {
    if (!currentData) return;

    if (Array.isArray(currentData)) {
      queryClient.setQueryData(
        queryKey,
        (currentData as InstructorRoadmap[]).map((roadmap) =>
          roadmap.id === roadmapId ? patcher(roadmap) : roadmap,
        ),
      );
      return;
    }

    const maybePaginated = currentData as PaginatedRoadmapResult;
    if (Array.isArray(maybePaginated.data)) {
      queryClient.setQueryData(queryKey, {
        ...maybePaginated,
        data: maybePaginated.data.map((roadmap) =>
          roadmap.id === roadmapId ? patcher(roadmap) : roadmap,
        ),
      });
      return;
    }

    const maybeDetail = currentData as InstructorRoadmap;
    if (maybeDetail?.id === roadmapId) {
      queryClient.setQueryData(queryKey, patcher(maybeDetail));
    }
  });

  return rootQueries;
}

export function useAddRoadmapCourse() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof roadmapCourseApi.addCourse>>,
    Error,
    AddRoadmapCourseVariables,
    UpdateRoadmapCourseContext
  >({
    mutationKey: roadmapKeys.custom("add-course"),
    mutationFn: ({ roadmapId, data }) =>
      roadmapCourseApi.addCourse(roadmapId, data),
    retry: false,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: roadmapKeys.root });

      const previousRootQueries = patchAllRoadmapCaches(
        queryClient,
        variables.roadmapId,
        (roadmap) => patchAddRoadmapCourseInRoadmap(roadmap, variables),
      );

      return { previousRootQueries };
    },
    onSuccess: (data, variables) => {
      patchAllRoadmapCaches(queryClient, variables.roadmapId, (roadmap) =>
        patchAddRoadmapCourseInRoadmap(roadmap, variables, data),
      );
    },
    onError: (_error, _variables, context) => {
      context?.previousRootQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
    },
  });
}

export function useUpdateRoadmapCourse() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof roadmapCourseApi.updateCourse>>,
    Error,
    UpdateRoadmapCourseVariables,
    UpdateRoadmapCourseContext
  >({
    mutationKey: roadmapKeys.custom("update-course"),
    mutationFn: ({ roadmapId, courseId, data }) =>
      roadmapCourseApi.updateCourse(roadmapId, courseId, data),
    retry: false,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: roadmapKeys.root });

      const previousRootQueries = patchRoadmapCourseAcrossCache(
        queryClient,
        variables,
      );

      return { previousRootQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousRootQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
    },
  });
}

export function useRemoveRoadmapCourse() {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof roadmapCourseApi.removeCourse>>,
    Error,
    RemoveRoadmapCourseVariables,
    UpdateRoadmapCourseContext
  >({
    mutationKey: roadmapKeys.custom("remove-course"),
    mutationFn: ({ roadmapId, courseId }) =>
      roadmapCourseApi.removeCourse(roadmapId, courseId),
    retry: false,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: roadmapKeys.root });

      const previousRootQueries = patchAllRoadmapCaches(
        queryClient,
        variables.roadmapId,
        (roadmap) => patchRemoveRoadmapCourseInRoadmap(roadmap, variables),
      );

      return { previousRootQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousRootQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: roadmapKeys.root });
    },
  });
}
