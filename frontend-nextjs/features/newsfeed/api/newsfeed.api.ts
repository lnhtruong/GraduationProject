import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import { withQueryPath } from "@/features/_shared/crud-factories";
import type {
  NewsfeedCommentPageResponse,
  NewsfeedItem,
  NewsfeedPageResponse,
  NewsfeedRawItem,
} from "../types";

const FEED_ENDPOINT = "/media/feed";

function mapFeedItem(raw: NewsfeedRawItem): NewsfeedItem {
  const courseName = raw.course?.name?.trim() || "Khoa hoc";
  const title = raw.title?.trim() || courseName || "Video";
  const description = raw.course?.description?.trim() || title;
  const video = raw.video;
  const categories = Array.isArray(raw.course?.categories)
    ? raw.course.categories.filter((tag) => typeof tag === "string")
    : [];

  return {
    id: raw.feed_id,
    feedId: raw.feed_id,
    title,
    description,
    videoUrl: video.url,
    thumbnail: video.thumbnail ?? null,
    type: raw.video_type ?? video.type ?? "unknown",
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    lecturer: raw.lecturer,
    stats: {
      likes: raw.stats?.likes ?? 0,
      comments: raw.stats?.comments ?? 0,
      saves: raw.stats?.saves ?? 0,
      shares: 0,
      views: raw.stats?.views ?? 0,
    },
    isLiked: Boolean(raw.is_liked),
    isSaved: Boolean(raw.is_saved),
    video,
    course: {
      id: raw.course?.id ?? raw.feed_id,
      name: courseName,
      level: raw.course?.level?.trim() || "Unknown",
      duration: raw.course?.duration?.trim() || "N/A",
      language: raw.course?.language?.trim() || "vi",
      price: Number(raw.course?.price ?? 0),
      userId: Number(raw.course?.userId ?? 0),
      status: raw.course?.status ?? "published",
      categories,
      thumbnail: raw.course?.thumbnail ?? video.thumbnail ?? null,
      description,
      created_at:
        raw.course?.created_at ?? video.created_at ?? new Date().toISOString(),
      updated_at:
        raw.course?.updated_at ?? video.updated_at ?? new Date().toISOString(),
    },
  };
}

export const newsfeedApi = createApi({
  getFeed: async ({
    cursor = 0,
    limit = 8,
  }: {
    cursor?: number;
    limit?: number;
  }): Promise<{ items: NewsfeedItem[]; nextCursor: number | null }> => {
    const { data } = await apiHttpClient.get<NewsfeedPageResponse>(
      withQueryPath(FEED_ENDPOINT, {
        cursor,
        limit,
      }),
    );

    return {
      items: (Array.isArray(data.data) ? data.data : [])
        .map(mapFeedItem)
        .filter((item) => Boolean(item.videoUrl)),
      nextCursor:
        typeof data.next_cursor === "number" ? data.next_cursor : null,
    };
  },

  getComments: async ({
    feedId,
    cursor,
    limit = 20,
  }: {
    feedId: number;
    cursor?: number;
    limit?: number;
  }) => {
    const { data } = await apiHttpClient.get<NewsfeedCommentPageResponse>(
      withQueryPath(`${FEED_ENDPOINT}/${feedId}/comments`, {
        cursor,
        limit,
      }),
    );

    return {
      items: Array.isArray(data.data) ? data.data : [],
      nextCursor:
        typeof data.next_cursor === "number" ? data.next_cursor : null,
    };
  },

  createComment: async ({
    feedId,
    content,
  }: {
    feedId: number;
    content: string;
  }) => {
    const { data } = await apiHttpClient.post(`${FEED_ENDPOINT}/${feedId}/comments`, {
      content,
    });
    return data;
  },
});
