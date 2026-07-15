import NewsfeedPage from "@/features/newsfeed";
import { API_URL } from "@/lib/env";
import { buildCourseMetadata } from "@/lib/metadata";
import { BRAND } from "@/lib/brand";

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
				return buildCourseMetadata(course, "video ngắn", "video.episode");
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
	const rawVideoId = Array.isArray(resolvedSearchParams?.videoId)
		? resolvedSearchParams.videoId[0]
		: resolvedSearchParams?.videoId;
	const initialVideoId = rawVideoId ? Number(rawVideoId) : null;

	return <NewsfeedPage initialVideoId={Number.isFinite(initialVideoId ?? NaN) ? initialVideoId : null} />;
}
