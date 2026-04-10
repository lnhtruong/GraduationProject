import { createSimpleApi } from "@/features/_shared/api";
import { videoApi } from "@/features/video";
import type { NewsfeedItem } from "../types";

const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const COURSE_CATEGORIES = [
	"AI in Education",
	"Data Storytelling",
	"Learning Design",
	"Productivity",
	"Digital Skills",
] as const;

function buildMockStats(seed: number) {
	return {
		likes: 100 + (seed * 37) % 2000,
		comments: 10 + (seed * 17) % 240,
		saves: 6 + (seed * 11) % 200,
		shares: 4 + (seed * 13) % 120,
	};
}

function mapToNewsfeedItem(index: number, rawVideo: Awaited<
	ReturnType<typeof videoApi.getAllByUser>
>[number]): NewsfeedItem {
	const displayIndex = index + 1;
	const level = COURSE_LEVELS[index % COURSE_LEVELS.length];
	const category = COURSE_CATEGORIES[index % COURSE_CATEGORIES.length];

	return {
		id: rawVideo.id,
		title: `Bai hoc ngan #${displayIndex}`,
		description:
			"Tom tat noi dung bai giang theo phong cach ngan gon de hoc vien xem nhanh tren newsfeed.",
		videoUrl: rawVideo.url,
		thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
		type: rawVideo.type,
		stats: buildMockStats(displayIndex),
		sourceVideo: rawVideo,
		course: {
			id: rawVideo.id,
			title: `Khoa hoc demo ${displayIndex}`,
			instructor: `Giang vien ${displayIndex}`,
			category,
			level,
			durationLabel: `${12 + (displayIndex % 8)} gio`,
			totalLessons: 8 + (displayIndex % 20),
			thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
			description:
				"Mo ta demo cho thong tin khoa hoc. Sau nay co the thay bang API chi tiet khoa hoc.",
			tags: ["video ngan", "hoc nhanh", "thuc hanh"],
			students: 200 + displayIndex * 13,
			rating: Number((4 + ((displayIndex % 9) / 10)).toFixed(1)),
		},
	};
}

export const newsfeedApi = createSimpleApi({
	getFeed: async () => {
		const [highlightResult, mascotResult] = await Promise.allSettled([
			videoApi.getAllByUser("highlight"),
			videoApi.getAllByUser("mascot"),
		]);

		const merged = [
			...(highlightResult.status === "fulfilled" ? highlightResult.value : []),
			...(mascotResult.status === "fulfilled" ? mascotResult.value : []),
		];

		const uniqueById = new Map<number, (typeof merged)[number]>();
		for (const video of merged) {
			uniqueById.set(video.id, video);
		}

		const videos = Array.from(uniqueById.values());

		// Keep a fallback for environments where only the generic endpoint works.
		if (!videos.length) {
			const allVideos = await videoApi.getAllByUser(null);
			return allVideos
				.filter((video) => Boolean(video.url))
				.map((video, index) => mapToNewsfeedItem(index, video));
		}

		return videos
			.filter((video) => Boolean(video.url))
			.map((video, index) => mapToNewsfeedItem(index, video));
	},
});
