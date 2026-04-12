import { createApi } from "@/features/_shared/api-factories";
import { videoApi } from "@/features/video";
import {
  buildMockCourseInfo,
  buildMockFeedInfo,
  buildMockStats,
} from "../data/mock_data";
import type { NewsfeedItem } from "../types";

function mapToNewsfeedItem(
  index: number,
  rawVideo: Awaited<ReturnType<typeof videoApi.getAllByUser>>[number],
): NewsfeedItem {
  const displayIndex = index + 1;
  const feedInfo = buildMockFeedInfo(displayIndex);
  const courseInfo = buildMockCourseInfo(index, displayIndex, rawVideo.user_id);

  return {
    id: rawVideo.id,
    title: feedInfo.title,
    description: feedInfo.description,
    videoUrl: rawVideo.url,
    thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
    type: rawVideo.type,
    stats: buildMockStats(displayIndex),
    sourceVideo: rawVideo,
    course: {
      id: rawVideo.id,
      name: courseInfo.name,
      level: courseInfo.level,
      duration: courseInfo.duration,
      language: courseInfo.language,
      price: courseInfo.price,
      userId: courseInfo.userId,
      status: courseInfo.status,
      categories: courseInfo.categories,
      thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
      description: courseInfo.description,
      created_at: courseInfo.created_at,
      updated_at: courseInfo.updated_at,
    },
  };
}

export const newsfeedApi = createApi({
  getFeed: async () => {
    const [highlightResult, mascotResult, allResult] = await Promise.allSettled([
      videoApi.getAllByUser("highlight"),
      videoApi.getAllByUser("mascot"),
      videoApi.getAllByUser(null),
    ]);

    const merged = [
      ...(highlightResult.status === "fulfilled" ? highlightResult.value : []),
      ...(mascotResult.status === "fulfilled" ? mascotResult.value : []),
      ...(allResult.status === "fulfilled" ? allResult.value : []),
    ];

    if (!merged.length) {
      throw new Error("Khong the tai du lieu video newsfeed. Vui long thu lai.");
    }

    const uniqueById = new Map<number, (typeof merged)[number]>();
    for (const video of merged) {
      uniqueById.set(video.id, video);
    }

    const videos = Array.from(uniqueById.values());

    return videos
      .filter((video) => Boolean(video.url))
      .map((video, index) => mapToNewsfeedItem(index, video));
  },
});
