export type QuizQuestionType = "short_text" | "mcq" | "true/false";

export interface QuizOption {
	id?: number;
	optionText: string;
	isCorrect?: boolean;
	orderIndex?: number;
}

export interface QuizQuestion {
	id?: number;
	quesType: QuizQuestionType;
	quesText: string;
	point?: number;
	explanation?: string;
	orderIndex?: number;
	videoTimestamp?: string | null;
	evidenceTimestamp?: string | null;
	options?: QuizOption[];
}

export interface Quiz {
	id: number;
	lessonActivityId: number;
	name: string;
	shuffleQuestion: boolean;
	shuffleOption: boolean;
	passingScore?: number;
	timeLimitMinutes?: number;
	isInVideo: boolean;
	questions: QuizQuestion[];
}

export interface CreateQuizPayload {
	lessonActivityId: number;
	name: string;
	shuffleQuestion?: boolean;
	shuffleOption?: boolean;
	passingScore?: number;
	timeLimitMinutes?: number;
	isInVideo?: boolean;
	questions?: QuizQuestion[];
}

export interface CreateQuizAIPayload {
	lessonActivityId: number;
	videoId: number;
	name: string;
	shuffleQuestion?: boolean;
	shuffleOption?: boolean;
	passingScore?: number;
	timeLimitMinutes?: number;
	isInVideo?: boolean;
}

export type UpdateQuizPayload = Partial<CreateQuizPayload>;

export type QuizListParams = {
	lessonActivityId?: number;
};

export type LessonQuizTypeFilter = "in_video" | "after_video";

export interface QuizTimelineMarkerItem {
	quizId: number;
	lessonActivityId: number;
	questionIds: number[];
	questionId?: number;
	questionCount: number;
	quizName: string;
	questionText: string;
}

export interface QuizTimelineMarker extends QuizTimelineMarkerItem {
	timestamp: string;
	timestampLabel: string;
	timestampSeconds: number;
	quizCount?: number;
	items?: QuizTimelineMarkerItem[];
}
