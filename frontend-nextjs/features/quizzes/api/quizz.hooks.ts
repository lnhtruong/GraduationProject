import { useQuery } from "@tanstack/react-query";
import { createCrudHooks } from "@/features/_shared/crud-factories";
import { createKeyFactory } from "@/lib/queryKeys";
import { quizApi } from "./quizz.api";
import type {
	CreateQuizPayload,
	LessonQuizTypeFilter,
	Quiz,
	QuizListParams,
	UpdateQuizPayload,
} from "../types";

export const quizHooks = createCrudHooks<
	Quiz,
	CreateQuizPayload,
	UpdateQuizPayload,
	number,
	number,
	QuizListParams
>("quiz", quizApi, {
	parentListKey: "lessonActivityId",
	parentListParamsBuilder: (lessonActivityId) => ({
		lessonActivityId: Number(lessonActivityId),
	}),
});

export const quizKeys = quizHooks.keys;

export const {
	useList: useQuizzes,
	useListByParent: useQuizzesByLessonActivityId,
	useDetail: useQuizById,
	useCreate: useCreateQuiz,
	useUpdate: useUpdateQuiz,
	useUpdatePatch: useUpdateQuizPatch,
	useDelete: useDeleteQuiz,
} = quizHooks;

const lessonQuizKeys = createKeyFactory("lesson-quizzes");

export function useQuizzesByLessonId(
	lessonId: number | null,
	type?: LessonQuizTypeFilter,
	status?: string,
	enabled = true,
) {
	return useQuery({
		queryKey: lessonQuizKeys.custom("by-lesson", lessonId, type ?? "all", status ?? "all"),
		queryFn: () => quizApi.listByLesson(lessonId as number, type, status),
		enabled: enabled && lessonId !== null,
		staleTime: 60 * 1000,
	});
}
