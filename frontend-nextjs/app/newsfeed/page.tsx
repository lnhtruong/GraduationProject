import NewsfeedPage from "@/features/newsfeed";
import { API_URL } from "@/lib/env";
import { buildCourseMetadata } from "@/lib/metadata";

interface NewsfeedProps {
	searchParams?: Promise<{ videoId?: string | string[]; courseId?: string | string[] }>;
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
				return buildCourseMetadata(course, "#shorts", "video.episode");
			}
		} catch {
			// Fall through
		}
	}

	const rawVideoId = Array.isArray(resolvedSearchParams?.videoId)
		? resolvedSearchParams.videoId[0]
		: resolvedSearchParams?.videoId;

	if (rawVideoId) {
		return {
			title: "Xem video ngắn #shorts | LearnHub",
			description: "Xem các bài học ngắn, sinh động trên bảng tin LearnHub.",
			openGraph: {
				title: "Xem video ngắn #shorts | LearnHub",
				description: "Xem các bài học ngắn, sinh động trên bảng tin LearnHub.",
				images: ["/logo.png"],
			},
		};
	}

	return {
		title: "Bảng tin bài học ngắn | LearnHub",
		description: "Khám phá các video bài học ngắn hấp dẫn trên LearnHub.",
		openGraph: {
			title: "Bảng tin bài học ngắn | LearnHub",
			description: "Khám phá các video bài học ngắn hấp dẫn trên LearnHub.",
			images: ["/logo.png"],
		},
	};
}

export default async function NewsfeedRoutePage({
	searchParams,
}: NewsfeedProps) {
	const resolvedSearchParams = await searchParams;
	const rawVideoId = Array.isArray(resolvedSearchParams?.videoId)
		? resolvedSearchParams.videoId[0]
		: resolvedSearchParams?.videoId;
	const initialVideoId = rawVideoId ? Number(rawVideoId) : null;

	return <NewsfeedPage initialVideoId={Number.isFinite(initialVideoId ?? NaN) ? initialVideoId : null} />;
}
