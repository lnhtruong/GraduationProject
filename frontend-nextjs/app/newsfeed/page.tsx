import NewsfeedPage from "@/features/newsfeed";
import { API_URL } from "@/lib/env";
import { buildCourseMetadata } from "@/lib/metadata";
import { BRAND } from "@/lib/brand";

interface NewsfeedProps {
	searchParams?: Promise<{
		feedId?: string | string[];
		commentId?: string | string[];
		parentCommentId?: string | string[];
		courseId?: string | string[];
	}>;
}

export async function generateMetadata({ searchParams }: NewsfeedProps) {
	const resolvedSearchParams = await searchParams;
	const rawCourseId = Array.isArray(resolvedSearchParams?.courseId)
		? resolvedSearchParams.courseId[0]
		: resolvedSearchParams?.courseId;
	const courseId = rawCourseId ? Number(rawCourseId) : null;

	if (courseId && !Number.isNaN(courseId)) {
		try {
			const res = await fetch(`${API_URL}/course/courses/${courseId}`, {
				next: { revalidate: 300 },
			});
			if (res.ok) {
				const course = await res.json();
				return buildCourseMetadata(course, "video ngắn", "video.episode");
			}
		} catch {
			// Fall through
		}
	}

	const rawFeedId = Array.isArray(resolvedSearchParams?.feedId)
		? resolvedSearchParams.feedId[0]
		: resolvedSearchParams?.feedId;

	if (rawFeedId) {
		return {
			title: "Xem video ngắn",
			description: "Xem các bài học ngắn, sinh động trên bảng tin StudyLoop.",
			openGraph: {
				title: "Xem video ngắn",
				description: "Xem các bài học ngắn, sinh động trên bảng tin StudyLoop.",
				images: [BRAND.ogImage],
			},
		};
	}

	return {
		title: "Bảng tin bài học ngắn",
		description: "Khám phá các video bài học ngắn hấp dẫn trên StudyLoop.",
		openGraph: {
			title: "Bảng tin bài học ngắn",
			description: "Khám phá các video bài học ngắn hấp dẫn trên StudyLoop.",
			images: [BRAND.ogImage],
		},
	};
}

export default async function NewsfeedRoutePage({
	searchParams,
}: NewsfeedProps) {
	const resolvedSearchParams = await searchParams;
	const rawFeedId = Array.isArray(resolvedSearchParams?.feedId)
		? resolvedSearchParams.feedId[0]
		: resolvedSearchParams?.feedId;
	const rawCommentId = Array.isArray(resolvedSearchParams?.commentId)
		? resolvedSearchParams.commentId[0]
		: resolvedSearchParams?.commentId;
	const rawParentCommentId = Array.isArray(resolvedSearchParams?.parentCommentId)
		? resolvedSearchParams.parentCommentId[0]
		: resolvedSearchParams?.parentCommentId;
	const initialFeedId = rawFeedId ? Number(rawFeedId) : null;
	const initialCommentId = rawCommentId ? Number(rawCommentId) : null;
	const initialParentCommentId = rawParentCommentId ? Number(rawParentCommentId) : null;

	return (
		<NewsfeedPage
			initialFeedId={Number.isFinite(initialFeedId ?? NaN) ? initialFeedId : null}
			initialCommentId={Number.isFinite(initialCommentId ?? NaN) ? initialCommentId : null}
			initialParentCommentId={Number.isFinite(initialParentCommentId ?? NaN) ? initialParentCommentId : null}
		/>
	);
}
