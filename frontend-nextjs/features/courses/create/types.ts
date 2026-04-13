import type { CourseLevel, CourseStatus } from "../types";

export interface CreateCourseFormValues {
	name: string;
	description: string;
	categories: string[];
	level: CourseLevel;
	durationHours: number;
	durationMinutes: number;
	language: string;
	price: number;
	status: CourseStatus;
}

export const COURSE_LEVEL_OPTIONS: Array<{
	value: CourseLevel;
	label: string;
	helper: string;
}> = [
	{
		value: "Beginner",
		label: "Beginner",
		helper: "Dành cho người mới bắt đầu, chưa có nền tảng.",
	},
	{
		value: "Intermediate",
		label: "Intermediate",
		helper: "Dành cho học viên đã có kiến thức cơ bản.",
	},
	{
		value: "Advanced",
		label: "Advanced",
		helper: "Dành cho học viên cần chuyên sâu và ứng dụng thực tế.",
	},
];

export const COURSE_STATUS_OPTIONS: Array<{
	value: CourseStatus;
	label: string;
	helper: string;
}> = [
	{
		value: "draft",
		label: "Nháp",
		helper: "Lưu lại để chỉnh sửa thêm trước khi gửi duyệt.",
	},
	{
		value: "pending",
		label: "Chờ duyệt",
		helper: "Gửi khóa học để đội ngũ kiểm duyệt đánh giá.",
	},
	{
		value: "publish",
		label: "Công khai",
		helper: "Hiển thị ngay cho học viên sau khi tạo.",
	},
];

export const COURSE_LANGUAGE_OPTIONS = [
	"Vietnamese",
	"English",
	"Japanese",
	"Korean",
	"Chinese",
];
