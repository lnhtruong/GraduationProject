export type NewsfeedActionType =
	| "course"
	| "like"
	| "comment"
	| "save"
	| "share";

export interface NewsfeedCourseInfo {
	id: number;
	name: string;
	level: string;
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
	views: number;
}

export interface NewsfeedFeedStatsItem {
	feedId: number;
	title: string;
	course: {
		id: number;
		name: string;
	};
	stats: {
		views: number;
		uniqueViewers: number;
		completedViews: number;
		completionRate: number;
		averageWatchDuration: number;
		likes: number;
		saves: number;
		shares: number;
		comments: number;
		engagementRate?: number;
		score?: number;
	};
}

export interface NewsfeedFeedDetailStatsResponse extends NewsfeedFeedStatsItem {}

export interface NewsfeedVideoData {
	id: number;
	user_id?: number;
	name?: string | null;
	url: string;
	thumbnail?: string | null;
	duration?: number | null;
	type?: string;
	created_at?: string;
	updated_at?: string;
}

export interface NewsfeedLecturer {
	id: number;
	firstName?: string;
	lastName?: string;
}

export interface NewsfeedRawItem {
	feed_id: number;
	title?: string;
	caption?: string | null;
	hashtags?: string[] | null;
	video_type?: string;
	video: NewsfeedVideoData;
	course: NewsfeedCourseInfo;
	lecturer?: NewsfeedLecturer;
	stats?: {
		views?: number;
		likes?: number;
		saves?: number;
		comments?: number;
	};
	is_liked?: boolean;
	is_saved?: boolean;
}

export interface NewsfeedPageResponse {
	data: NewsfeedRawItem[];
	next_cursor: number | null;
}

export interface NewsfeedItem {
	id: number;
	feedId: number;
	title: string;
	caption: string | null;
	description: string;
	videoUrl: string;
	thumbnail: string | null;
	type: string;
	hashtags: string[];
	lecturer?: NewsfeedLecturer;
	stats: NewsfeedVideoStats;
	isLiked: boolean;
	isSaved: boolean;
	video: NewsfeedVideoData;
	course: NewsfeedCourseInfo;
}

export interface NewsfeedCommentItem {
	id: number;
	content: string;
	origin_cmt?: number | null;
	total_nested_cmt?: number;
	created_at: string;
	updated_at: string;
	commenter?: {
		id: number;
		firstName?: string;
		lastName?: string;
	};
	is_owner: boolean;
}

export interface NewsfeedCommentPageResponse {
	data: NewsfeedCommentItem[];
	next_cursor: number | null;
}

export interface NewsfeedCommentDetailResponse {
	origin_cmt: number;
	data: NewsfeedCommentItem[];
	next_cursor: number | null;
}

export interface NewsfeedFeedStatsSummary {
	totalFeeds: number;
	views: number;
	likes: number;
	saves: number;
	shares: number;
	comments: number;
	completionRate: number;
}

export interface NewsfeedCreatorStatsItem {
	feedId: number;
	title: string;
	caption: string | null;
	course: {
		id: number;
		name: string;
	};
	stats: {
		views: number;
		uniqueViewers: number;
		completedViews: number;
		completionRate: number;
		averageWatchDuration: number;
		likes: number;
		saves: number;
		shares: number;
		comments: number;
		engagementRate: number;
	};
}

export interface NewsfeedCreatorStatsResponse {
	summary: NewsfeedFeedStatsSummary;
	data: NewsfeedCreatorStatsItem[];
}

export interface NewsfeedTrendingStatsItem {
	feedId: number;
	title: string;
	caption: string | null;
	course: {
		id: number;
		name: string;
	};
	rank: number;
	stats: {
		views: number;
		uniqueViewers: number;
		completedViews: number;
		completionRate: number;
		averageWatchDuration: number;
		likes: number;
		saves: number;
		shares: number;
		comments: number;
		score: number;
	};
}

export interface NewsfeedTrendingStatsResponse {
	period: string;
	data: NewsfeedTrendingStatsItem[];
}

export interface NewsfeedFeedMutationResponse {
	[key: string]: unknown;
}

export interface NewsfeedViewRecordResponse {
	recorded: boolean;
}

export interface NewsfeedCommentMutationResponse {
	id: number;
	content: string;
	origin_cmt?: number | null;
	created_at: string;
	updated_at: string;
	is_owner: boolean;
}

export interface NewsfeedNavItem {
	id: string;
	label: string;
	href?: string;
	description?: string;
}
