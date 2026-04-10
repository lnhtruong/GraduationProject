import { createSimpleApi } from "@/features/_shared/api";
import { videoApi } from "@/features/video";
import type { NewsfeedItem } from "../types";

const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const COURSE_CATEGORIES = [
	["Frontend", "React"],
	["Backend", "NodeJS"],
	["Data", "SQL"],
	["Mobile", "Flutter"],
	["AI", "Prompting"],
] as const;

const COURSE_STATUSES = ["draft", "published"] as const;

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
	const categories = COURSE_CATEGORIES[index % COURSE_CATEGORIES.length];
	const status = COURSE_STATUSES[index % COURSE_STATUSES.length];
	const createdAt = new Date(Date.now() - displayIndex * 86400000).toISOString();
	const updatedAt = new Date(Date.now() - displayIndex * 3600000).toISOString();

	return {
		id: rawVideo.id,
		title: `Bai hoc ngan #${displayIndex}`,
		description:
			"Tom tat noi dung bai giang theo phong cach ngan gon de hoc vien xem nhanh tren newsfeed. Ban demo newsfeed dang su dung mock data theo format API khoa hoc. Thong tin chi tiet se duoc hien thi khi click vao tung bai hoc.",
		videoUrl: rawVideo.url,
		thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
		type: rawVideo.type,
		stats: buildMockStats(displayIndex),
		sourceVideo: rawVideo,
		course: {
			id: rawVideo.id,
			name: `React cho nguoi moi bat dau #${displayIndex}`,
			level,
			duration: `${10 + (displayIndex % 8)}:${String(20 + (displayIndex % 30)).padStart(2, "0")}:00`,
			language: "vi",
			price: 299000 + (displayIndex % 5) * 100000,
			userId: rawVideo.user_id ?? 1,
			status,
			categories: [...categories],
			thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
			description:
				"Khoa hoc tu co ban den du an nho. Ban demo newsfeed dang su dung mock data theo format API khoa hoc.",
			created_at: createdAt,
			updated_at: updatedAt,
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
