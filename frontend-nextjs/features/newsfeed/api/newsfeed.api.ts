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
  const courseInfo = buildMockCourseInfo(index, displayIndex);

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
      title: courseInfo.title,
      instructor: courseInfo.instructor,
      category: courseInfo.category,
      level: courseInfo.level,
      durationLabel: courseInfo.durationLabel,
      totalLessons: courseInfo.totalLessons,
      thumbnail: rawVideo.thumbnail ?? rawVideo.image?.thumbnail ?? null,
      description: courseInfo.description,
      tags: courseInfo.tags,
      students: courseInfo.students,
      rating: courseInfo.rating,
    },
  };
}

export const newsfeedApi = createApi({
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
