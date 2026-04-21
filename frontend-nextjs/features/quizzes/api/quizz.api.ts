import {
	createResourceApi,
	withQueryPath,
} from "@/features/_shared/crud-factories";
import { apiHttpClient } from "@/features/_shared/api-factories";
import type {
	CreateQuizAIPayload,
	CreateQuizPayload,
	LessonQuizTypeFilter,
	Quiz,
	QuizListParams,
	UpdateQuizPayload,
} from "../types";

type QuizApiResponse = {
	id?: number;
	lessonActivityId?: number;
	name?: string;
	shuffleQuestion?: boolean;
	shuffleOption?: boolean;
	passingScore?: number;
	timeLimitMinutes?: number;
	isInVideo?: boolean;
	questions?: Quiz["questions"];
};

type QuizListResponse = {
	data?: QuizApiResponse[];
};

function mapQuiz(raw: QuizApiResponse): Quiz {
	return {
		id: raw.id ?? 0,
		lessonActivityId: raw.lessonActivityId ?? 0,
		name: raw.name ?? "",
		shuffleQuestion: raw.shuffleQuestion ?? false,
		shuffleOption: raw.shuffleOption ?? false,
		passingScore: raw.passingScore,
		timeLimitMinutes: raw.timeLimitMinutes,
		isInVideo: raw.isInVideo ?? false,
		questions: Array.isArray(raw.questions) ? raw.questions : [],
	};
}

const quizCrudApi = createResourceApi<
	QuizApiResponse,
	Quiz,
	CreateQuizPayload,
	UpdateQuizPayload,
	number,
	QuizListParams,
	{ success?: boolean },
	QuizListResponse | QuizApiResponse[]
>({
	basePath: "/course/quizzes",
	mapItem: mapQuiz,
	mapListResponse: (raw) =>
		(Array.isArray(raw) ? raw : (raw.data ?? [])).map(mapQuiz),
	getListPath: (params) => withQueryPath("/course/quizzes", params),
});

export const quizApi = {
	...quizCrudApi,
	listByLesson: async (
		lessonId: number,
		type?: LessonQuizTypeFilter,
	): Promise<Quiz[]> => {
		const { data } = await apiHttpClient.get<QuizApiResponse[]>(
			`/course/quizzes/lesson/${lessonId}`,
			{
				params: type ? { type } : undefined,
			},
		);

		return (Array.isArray(data) ? data : []).map(mapQuiz);
	},
};

export const quizAiApi = {
	createOne: async (payload: CreateQuizAIPayload): Promise<Quiz> => {
		const { data } = await apiHttpClient.post<QuizApiResponse>(
			"/course/quizzes/ai",
			payload,
		);
		return mapQuiz(data);
	},
	createMany: async (payload: CreateQuizAIPayload[]): Promise<Quiz[]> => {
		const { data } = await apiHttpClient.post<QuizApiResponse[]>(
			"/course/quizzes/ai",
			payload,
		);
		return (Array.isArray(data) ? data : []).map(mapQuiz);
	},
};

export type {
	CreateQuizAIPayload,
	CreateQuizPayload,
	LessonQuizTypeFilter,
	Quiz,
	QuizListParams,
	UpdateQuizPayload,
} from "../types";
