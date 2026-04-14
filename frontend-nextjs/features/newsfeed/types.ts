import type { Video } from "@/features/video";

export type NewsfeedActionType =
	| "course"
	| "like"
	| "comment"
	| "bookmark"
	| "share";

export interface NewsfeedCourseInfo {
	id: number;
	name: string;
	level: "Beginner" | "Intermediate" | "Advanced";
	duration: string;
	language: string;
	price: number;
	userId: number;
	status: "draft" | "published" | "archived" | string;
	categories: string[];
	thumbnail: string | null;
	description: string;
	created_at: string;
	updated_at: string;
}

export interface NewsfeedVideoStats {
	likes: number;
	comments: number;
	saves: number;
	shares: number;
}

export interface NewsfeedItem {
	id: number;
	title: string;
	description: string;
	videoUrl: string;
	thumbnail: string | null;
	type: Video["type"];
	stats: NewsfeedVideoStats;
	sourceVideo: Video;
	course: NewsfeedCourseInfo;
}

export interface NewsfeedNavItem {
	id: string;
	label: string;
	href?: string;
	description?: string;
}
