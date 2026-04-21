export type LessonContentType = "video" | "text";

export type LessonStatus = "active" | "removed" | "blocked";

export type LessonActivityStatus = "draft" | "public" | "archived" | "removed";

export type LessonActivityType = "quiz" | "assignment";

export interface Lesson {
	id: number;
	courseId: number;
	videoId?: number | null;
	title: string;
	contentType: LessonContentType;
	content: Record<string, unknown>;
	// UI keeps duration as minutes for simple input/editing.
	duration?: number;
	status: LessonStatus;
	description?: string;
	created_at?: string;
	updated_at?: string;
}

export interface CreateLessonPayload {
	courseId: number;
	title: string;
	description?: string;
	contentType: LessonContentType;
	duration?: number | string;
	content: Record<string, unknown>;
	status?: LessonStatus;
	videoId?: number | null;
}

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

export type LessonListParams = {
	courseId?: number;
	page?: number;
	limit?: number;
};

export interface LessonActivity {
	id: number;
	lessonId: number;
	activityType: LessonActivityType;
	title?: string;
	description?: string;
	orderIndex?: number;
	maxAttempts?: number;
	status: LessonActivityStatus;
	createdBy?: number;
}

export type CreateLessonActivityPayload = Omit<LessonActivity, "id">;

export type UpdateLessonActivityPayload = Partial<LessonActivity>;

export type LessonActivityListParams = {
	lessonId?: number;
};
