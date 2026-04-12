import type { Video } from "@/features/video";

export type NewsfeedActionType =
	| "course"
	| "like"
	| "comment"
	| "bookmark"
	| "share";

export interface NewsfeedCourseInfo {
	id: number;
	title: string;
	instructor: string;
	category: string;
	level: "Beginner" | "Intermediate" | "Advanced";
	durationLabel: string;
	totalLessons: number;
	thumbnail: string | null;
	description: string;
	tags: string[];
	students: number;
	rating: number;
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
