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
	correctAns?: string;
	orderIndex?: number;
	videoTimestamp?: string | null;
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
