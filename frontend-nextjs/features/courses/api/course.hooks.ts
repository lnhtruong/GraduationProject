import { createCrudHooks } from "@/features/_shared/crud-factories";
import { createMutationHooks } from "@/features/_shared/react-query-factories";
import { createKeyFactory } from "@/lib/queryKeys";
import type {
	Course,
	CourseListParams,
	CourseReviewAction,
	CreateCoursePayload,
	UpdateCoursePayload,
} from "../types";
import {
	courseApi,
	courseWorkflowApi,
} from "./course.api";

export const courseHooks = createCrudHooks<
	Course,
	CreateCoursePayload,
	UpdateCoursePayload,
	number,
	number,
	CourseListParams
>("course", courseApi);

export const courseKeys = courseHooks.keys;

export const {
	useList: useCourses,
	useDetail: useCourseById,
	useCreate: useCreateCourse,
	useUpdate: useUpdateCourse,
	useDelete: useDeleteCourse,
} = courseHooks;

const courseQueryKeys = createKeyFactory("course");

function invalidateCourseCache(
	queryClient: {
		invalidateQueries: (input: { queryKey: readonly unknown[] }) => void;
	},
	courseId?: number,
) {
	queryClient.invalidateQueries({ queryKey: courseQueryKeys.root });
	if (typeof courseId === "number") {
		queryClient.invalidateQueries({
			queryKey: courseQueryKeys.detail(courseId),
		});
	}
}

export const useSubmitCourseForReview = createMutationHooks<Course, number>(
	"course",
	"submitForReview",
	(courseId) => courseWorkflowApi.submitForReview(courseId),
	{
		retry: false,
		onSuccess: (data, _variables, queryClient) => {
			invalidateCourseCache(queryClient, data.id);
		},
	},
);

export const useReviewCourse = createMutationHooks<
	Course,
	{ courseId: number; status: CourseReviewAction }
>(
	"course",
	"review",
	({ courseId, status }) => courseWorkflowApi.review(courseId, status),
	{
		retry: false,
		onSuccess: (data, _variables, queryClient) => {
			invalidateCourseCache(queryClient, data.id);
		},
	},
);

export const usePublishCourse = createMutationHooks<Course, number>(
	"course",
	"publish",
	(courseId) => courseWorkflowApi.publish(courseId),
	{
		retry: false,
		onSuccess: (data, _variables, queryClient) => {
			invalidateCourseCache(queryClient, data.id);
		},
	},
);

export const useQuickPublishCourse = createMutationHooks<
	Course,
	Pick<Course, "id" | "status">
>(
	"course",
	"quickPublish",
	async ({ id, status }) => {
		if (status === "publish" || status === "approved") {
			return courseWorkflowApi.publish(id);
		}

		if (status === "pending") {
			await courseWorkflowApi.review(id, "accepted");
			return courseWorkflowApi.publish(id);
		}

		if (status === "draft") {
			await courseWorkflowApi.submitForReview(id);
			await courseWorkflowApi.review(id, "accepted");
			return courseWorkflowApi.publish(id);
		}

		throw new Error(
			"Khóa học đang ở trạng thái rejected. Vui lòng chỉnh sửa và gửi duyệt lại.",
		);
	},
	{
		retry: false,
		onSuccess: (data, _variables, queryClient) => {
			invalidateCourseCache(queryClient, data.id);
		},
	},
);
