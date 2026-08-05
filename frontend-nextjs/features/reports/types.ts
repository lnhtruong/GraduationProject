export type ReportTargetType = "teacher" | "course" | "lesson";
export type ReportStatus = "pending" | "approved" | "rejected";
export type ReportCategory = "misleading" | "copyright" | "inappropriate" | "spam" | "harassment" | "other";
export type ReviewDecision = Exclude<ReportStatus, "pending">;

export interface ReportUser {
	id: number;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
}

export interface ReportTargetCourse {
	id: number;
	name: string;
	status: string;
	userId: number;
}

export interface ReportTargetLesson {
	id: number;
	title: string;
	status: string;
	courseId: number;
}

export interface ReportTargetTeacher {
	id: number;
	firstName?: string | null;
	lastName?: string | null;
	email: string;
	role: number;
	isBanned: boolean;
}

export interface EvidenceImage {
	imageId: number;
	url: string;
	name?: string | null;
	format?: string | null;
	type: "report" | "role_upgrade";
}

export type ReportTarget =
	| ReportTargetCourse
	| ReportTargetLesson
	| ReportTargetTeacher
	| null;

export interface Report {
	id: number;
	targetType: ReportTargetType;
	targetId: number;
	reportCategory: ReportCategory | null;
	reason: string;
	status: ReportStatus;
	reporterId: number;
	approverId: number | null;
	reviewNote: string | null;
	reviewedAt: string | null;
	created_at: string;
	updated_at: string;
	evidenceImageIds?: number[] | null;
	evidenceImages?: EvidenceImage[];
	reporter?: ReportUser;
	approver?: ReportUser;
	target?: ReportTarget;
}

export interface ReportListResponse {
	items: Report[];
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface CreateReportDto {
	targetType: ReportTargetType;
	targetId: number;
	reportCategory: ReportCategory;
	reason: string;
	evidenceImageIds?: number[];
}

export interface ReviewReportDto {
	decision: ReviewDecision;
	reviewNote?: string;
	banTarget?: boolean;
}

export interface ReportListParams {
	page?: number;
	limit?: number;
	status?: ReportStatus;
	targetType?: ReportTargetType;
	reportCategory?: ReportCategory;
	sortOrder?: "asc" | "desc";
	search?: string;
}
