import { createApi, apiHttpClient } from "@/features/_shared/api-factories";
import { withQueryPath } from "@/features/_shared/crud-factories";
import type {
  NewsfeedCommentMutationResponse,
  NewsfeedCommentDetailResponse,
  NewsfeedCommentPageResponse,
  NewsfeedActionType,
  NewsfeedCreatorStatsResponse,
  NewsfeedFeedMutationResponse,
  NewsfeedFeedApiResponse,
  NewsfeedItem,
  NewsfeedTrendingHashtagsResponse,
  NewsfeedTrendingStatsResponse,
  NewsfeedFeedResponse,
  NewsfeedRawItem,
  NewsfeedViewRecordResponse,
} from "../types";

const FEED_ENDPOINT = "/media/feed";

const MEDIA_EXTENSIONS = ["mp4", "webm", "mov", "m4v"] as const;

function parseFeedResponse(response: NewsfeedFeedResponse) {
  if (Array.isArray(response)) {
    return {
      items: response,
      nextCursor: null as number | null,
      sessionId: null as string | null,
    };
  }

  return {
    items: Array.isArray(response.data) ? response.data : [],
    nextCursor: typeof response.next_cursor === "number" ? response.next_cursor : null,
    sessionId: typeof response.session_id === "string" ? response.session_id : null,
  };
}

function normalizeMediaUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmed);
    const pathname = parsedUrl.pathname;
    const duplicatedSegmentPattern = new RegExp(
      `^(.*\/)([^/]+\\.(?:${MEDIA_EXTENSIONS.join("|")}))\/\\2$`,
      "i",
    );
    const collapsedPathname = pathname.replace(
      duplicatedSegmentPattern,
      "$1$2",
    );

    if (collapsedPathname !== pathname) {
      parsedUrl.pathname = collapsedPathname;
      return parsedUrl.toString();
    }
  } catch {
    // Keep the original string when it is not a valid absolute URL.
  }

  return trimmed;
}

function mapFeedItem(raw: NewsfeedRawItem): NewsfeedItem {
  const courseName = raw.course?.name?.trim() || "Khóa học";
  const title = raw.title?.trim() || courseName || "Video";
  const caption = raw.caption?.trim() || null;
  const description = caption || raw.course?.description?.trim() || title;
  const video = raw.video;
  const videoUrl = normalizeMediaUrl(video.url);
  const thumbnailUrl = normalizeMediaUrl(video.thumbnail);
  const categories = Array.isArray(raw.course?.categories)
    ? raw.course.categories.filter((tag) => typeof tag === "string")
    : [];

  return {
    id: raw.feed_id,
    feedId: raw.feed_id,
    title,
    caption,
    description,
    videoUrl,
    thumbnail: thumbnailUrl || null,
    type: raw.video_type ?? video.type ?? "không xác định",
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    lecturer: raw.lecturer,
    stats: {
      likes: raw.stats?.likes ?? 0,
      comments: raw.stats?.comments ?? 0,
      saves: raw.stats?.saves ?? 0,
      shares: raw.stats?.shares ?? 0,
      views: raw.stats?.views ?? 0,
    },
    isLiked: Boolean(raw.is_liked),
    isSaved: Boolean(raw.is_saved),
    video,
    course: {
      id: raw.course?.id ?? raw.feed_id,
      name: courseName,
      level: raw.course?.level?.trim() || "Không rõ",
      duration: raw.course?.duration?.trim() || "--",
      language: raw.course?.language?.trim() || "vi",
      price: Number(raw.course?.price ?? 0),
      userId: Number(raw.course?.userId ?? 0),
      status: raw.course?.status ?? "published",
      categories,
      thumbnail: raw.course?.thumbnail ?? (thumbnailUrl || null),
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
    mode = "recommended",
    search,
    courseId,
    sessionId,
    hashtag,
  }: {
    cursor?: number;
    limit?: number;
    mode?: "recommended" | "search";
    search?: string;
    courseId?: number;
    sessionId?: string | null;
    hashtag?: string;
  }): Promise<NewsfeedFeedApiResponse> => {
    const { data } = await apiHttpClient.get<NewsfeedFeedResponse>(
      withQueryPath(FEED_ENDPOINT, {
        cursor,
        limit,
        mode,
        search,
        courseId,
        sessionId,
        hashtag,
      }),
    );

    const { items, nextCursor, sessionId: resolvedSessionId } = parseFeedResponse(data);

    return {
      items: items
        .map(mapFeedItem)
        .filter((item) => Boolean(item.videoUrl)),
      nextCursor,
      sessionId: resolvedSessionId,
    };
  },

    getViewedFeeds: async (): Promise<{ items: NewsfeedItem[]; nextCursor: number | null }> => {
      const { data } = await apiHttpClient.get<NewsfeedFeedResponse>(`${FEED_ENDPOINT}/viewed`);

      const { items, nextCursor } = parseFeedResponse(data);

      return {
        items: items.map(mapFeedItem).filter((item) => Boolean(item.videoUrl)),
        nextCursor,
      };
    },

    getSavedFeeds: async (): Promise<{ items: NewsfeedItem[]; nextCursor: number | null }> => {
      const { data } = await apiHttpClient.get<NewsfeedFeedResponse>(`${FEED_ENDPOINT}/saved`);

      const { items, nextCursor } = parseFeedResponse(data);

      return {
        items: items.map(mapFeedItem).filter((item) => Boolean(item.videoUrl)),
        nextCursor,
      };
    },

    addToFeed: async ({
      videoId,
      courseId,
      title,
      caption,
      hashtags,
    }: {
      videoId: number;
      courseId: number;
      title?: string;
      caption?: string;
      hashtags?: string[];
    }): Promise<NewsfeedFeedMutationResponse> => {
      const { data } = await apiHttpClient.post<NewsfeedFeedMutationResponse>(FEED_ENDPOINT, {
        video_id: videoId,
        course_id: courseId,
        title,
        caption,
        hashtags,
      });

      return data;
    },

    recordView: async ({
      feedId,
      watchDuration,
      completed,
    }: {
      feedId: number;
      watchDuration: number;
      completed: boolean;
    }): Promise<NewsfeedViewRecordResponse> => {
      const { data } = await apiHttpClient.post<NewsfeedViewRecordResponse>(
        `${FEED_ENDPOINT}/${feedId}/view`,
        {
          watch_duration: watchDuration,
          completed,
        },
      );

      return data;
    },

    updateFeed: async ({
      feedId,
      title,
      caption,
      hashtags,
      status,
    }: {
      feedId: number;
      title?: string;
      caption?: string;
      hashtags?: string[];
      status?: string;
    }): Promise<NewsfeedFeedMutationResponse> => {
      const { data } = await apiHttpClient.put<NewsfeedFeedMutationResponse>(
        `${FEED_ENDPOINT}/${feedId}`,
        {
          title,
          caption,
          hashtags,
          status,
        },
      );

      return data;
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

  getCommentDetail: async ({
    feedId,
    originCmt,
    cursor,
    limit = 20,
  }: {
    feedId: number;
    originCmt: number;
    cursor?: number;
    limit?: number;
  }) => {
    const { data } = await apiHttpClient.get<NewsfeedCommentDetailResponse>(
      withQueryPath(`${FEED_ENDPOINT}/${feedId}/comment/detail`, {
        origin_cmt: originCmt,
        cursor,
        limit,
      }),
    );

    return {
      origin_cmt: data.origin_cmt,
      items: Array.isArray(data.data) ? data.data : [],
      nextCursor: typeof data.next_cursor === "number" ? data.next_cursor : null,
    };
  },

  createComment: async ({
    feedId,
    content,
    originCmt,
  }: {
    feedId: number;
    content: string;
    originCmt?: number | null;
  }): Promise<NewsfeedCommentMutationResponse> => {
    const { data } = await apiHttpClient.post<NewsfeedCommentMutationResponse>(
      `${FEED_ENDPOINT}/${feedId}/comments`,
      {
        content,
        origin_cmt: originCmt ?? null,
      },
    );
    return data;
  },

  getCreatorStats: async ({
    period,
    limit,
  }: {
    period?: string;
    limit?: number;
  }): Promise<NewsfeedCreatorStatsResponse> => {
    const { data } = await apiHttpClient.get<NewsfeedCreatorStatsResponse>(
      withQueryPath(`${FEED_ENDPOINT}/stats/creator`, {
        period,
        limit,
      }),
    );

    return data;
  },

  getTrendingStats: async ({
    period,
    limit,
  }: {
    period?: string;
    limit?: number;
  }): Promise<NewsfeedTrendingStatsResponse> => {
    const { data } = await apiHttpClient.get<NewsfeedTrendingStatsResponse>(
      withQueryPath(`${FEED_ENDPOINT}/stats/trending`, {
        period,
        limit,
      }),
    );

    return data;
  },

  getTrendingHashtags: async ({
    days,
    limit,
  }: {
    days?: number;
    limit?: number;
  }): Promise<NewsfeedTrendingHashtagsResponse> => {
    const { data } = await apiHttpClient.get<NewsfeedTrendingHashtagsResponse>(
      withQueryPath(`${FEED_ENDPOINT}/hashtags/trending`, {
        days,
        limit,
      }),
    );

    return data;
  },

  interactFeed: async ({
    feedId,
    type,
  }: {
    feedId: number;
    type: Exclude<NewsfeedActionType, "course" | "comment">;
  }): Promise<{ type: Exclude<NewsfeedActionType, "course" | "comment">; active: boolean }> => {
    const { data } = await apiHttpClient.post<{ type: Exclude<NewsfeedActionType, "course" | "comment">; active: boolean }>(
      `${FEED_ENDPOINT}/${feedId}/interact`,
      { type },
    );
    return data;
  },

  updateComment: async ({
    feedId,
    commentId,
    content,
  }: {
    feedId: number;
    commentId: number;
    content: string;
  }): Promise<NewsfeedCommentMutationResponse> => {
    const { data } = await apiHttpClient.patch<NewsfeedCommentMutationResponse>(
      `${FEED_ENDPOINT}/${feedId}/comments/${commentId}`,
      { content },
    );

    return data;
  },

  deleteComment: async ({
    feedId,
    commentId,
  }: {
    feedId: number;
    commentId: number;
  }): Promise<{ deleted: boolean }> => {
    const { data } = await apiHttpClient.delete<{ deleted: boolean }>(
      `${FEED_ENDPOINT}/${feedId}/comments/${commentId}`,
    );

    return data;
  },
});
