import NewsfeedPage from "@/features/newsfeed";
import { API_URL } from "@/lib/env";

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
				const title = `${course.name} #shorts | LearnHub`;
				const cleanDesc = course.description
					? course.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) + "..."
					: `Xem video ngắn bài học từ khóa học ${course.name} trên LearnHub.`;
				const thumbnailUrl = course.video?.thumbnail || "/logo.png";
				const videoUrl = course.video?.url || undefined;

				return {
					title,
					description: cleanDesc,
					openGraph: {
						title,
						description: cleanDesc,
						images: [
							{
								url: thumbnailUrl,
								width: 1200,
								height: 630,
								alt: course.name,
							},
						],
						type: "video.episode",
						...(videoUrl && {
							videos: [
								{
									url: videoUrl,
									width: 1200,
									height: 675,
								},
							],
						}),
					},
				};
			}
		} catch (err) {
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
