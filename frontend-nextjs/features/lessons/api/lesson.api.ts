import {
	createResourceApi,
	withQueryPath,
} from "@/features/_shared/crud-factories";
import type {
	CreateLessonActivityPayload,
	CreateLessonPayload,
	Lesson,
	LessonActivity,
	LessonActivityListParams,
	LessonListParams,
	UpdateLessonActivityPayload,
	UpdateLessonPayload,
} from "../types";

type LessonListResponse = {
	data?: LessonApiResponse[];
};

type LessonApiResponse = {
	id?: number;
	courseId?: number;
	videoId?: number | null;
	title?: string;
	contentType?: Lesson["contentType"];
	content?: Record<string, unknown>;
	duration?: string | number | null;
	status?: Lesson["status"];
	description?: string;
	created_at?: string;
	updated_at?: string;
};

const DURATION_TIME_REGEX = /^\d{2,3}:[0-5]\d:[0-5]\d(\.\d{1,3})?$/;

function toTimeDuration(value?: number | string | null): string {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (DURATION_TIME_REGEX.test(trimmed)) {
			return trimmed;
		}

		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return "00:00:00";
		}

		value = parsed;
	}

	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return "00:00:00";
	}

	const totalSeconds = Math.max(0, Math.round(value * 60));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function toDurationMinutes(value?: string | number | null): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.max(0, value);
	}

	if (typeof value !== "string") {
		return 0;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return 0;
	}

	if (DURATION_TIME_REGEX.test(trimmed)) {
		const [h = "0", m = "0", s = "0"] = trimmed.split(":");
		const secondsPart = Number(s);
		const totalSeconds = Number(h) * 3600 + Number(m) * 60 + secondsPart;
		return Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds / 60) : 0;
	}

	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function toLessonPayload(payload: CreateLessonPayload | UpdateLessonPayload) {
	return {
		...payload,
		duration: toTimeDuration(payload.duration),
	};
}

function mapLesson(raw: LessonApiResponse): Lesson {
	return {
		id: raw.id ?? 0,
		courseId: raw.courseId ?? 0,
		videoId: raw.videoId ?? null,
		title: raw.title ?? "",
		contentType: raw.contentType ?? "text",
		content: raw.content ?? {},
		duration: toDurationMinutes(raw.duration),
		status: raw.status ?? "active",
		description: raw.description,
		created_at: raw.created_at,
		updated_at: raw.updated_at,
	};
}

const lessonCrudApi = createResourceApi<
	LessonApiResponse,
	Lesson,
	CreateLessonPayload,
	UpdateLessonPayload,
	number,
	LessonListParams,
	{ success?: boolean },
	LessonListResponse | LessonApiResponse[]
>({
	basePath: "/course/lessons",
	mapItem: mapLesson,
	mapListResponse: (raw) =>
		(Array.isArray(raw) ? raw : (raw.data ?? [])).map(mapLesson),
	toCreatePayload: toLessonPayload,
	toUpdatePayload: toLessonPayload,
	toPatchPayload: toLessonPayload,
	getListPath: (params) =>
		withQueryPath("/course/lessons/course", {
			courseId: params?.courseId,
			page: params?.page ?? 1,
			limit: params?.limit ?? 100,
		}),
});

type LessonActivityApiResponse = {
	id?: number;
	lessonId?: number;
	activityType?: LessonActivity["activityType"];
	title?: string;
	description?: string;
	orderIndex?: number;
	maxAttempts?: number;
	status?: LessonActivity["status"];
	createdBy?: number;
};

function mapLessonActivity(raw: LessonActivityApiResponse): LessonActivity {
	return {
		id: raw.id ?? 0,
		lessonId: raw.lessonId ?? 0,
		activityType: raw.activityType ?? "quiz",
		title: raw.title,
		description: raw.description,
		orderIndex: raw.orderIndex,
		maxAttempts: raw.maxAttempts,
		status: raw.status ?? "draft",
		createdBy: raw.createdBy,
	};
}

const lessonActivityCrudApi = createResourceApi<
	LessonActivityApiResponse,
	LessonActivity,
	CreateLessonActivityPayload,
	UpdateLessonActivityPayload,
	number,
	LessonActivityListParams,
	{ success?: boolean }
>({
	basePath: "/course/lesson-activities",
	mapItem: mapLessonActivity,
	getListPath: (params) =>
		withQueryPath("/course/lesson-activities", {
			lessonId: params?.lessonId,
		}),
});

export const lessonApi = lessonCrudApi;
export const lessonActivityApi = lessonActivityCrudApi;

export type {
	CreateLessonActivityPayload,
	CreateLessonPayload,
	Lesson,
	LessonActivity,
	LessonActivityListParams,
	LessonListParams,
	UpdateLessonActivityPayload,
	UpdateLessonPayload,
} from "../types";
