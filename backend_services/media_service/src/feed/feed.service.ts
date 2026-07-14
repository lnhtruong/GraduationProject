import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import { HighlightFeed, HighlightFeedStatus } from '../models/highlight_feed.model';
import { CourseStatus } from '../models/course.model';
import { FeedInteraction, FeedInteractionType } from '../models/feed_interactions.model';
import { FeedView } from '../models/feed_views.model';
import { FeedComment } from '../models/feed_comments.model';
import { Video } from '../videos/video.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationEventType,
  NotificationSourceType,
  NotificationSseEventType,
} from '../notifications/notification.enums';

type FeedStats = {
  likes: number;
  saves: number;
  shares: number;
  views: number;
  comments: number;
};

type FeedResponseItem = {
  feed_id: number;
  title?: string;
  caption?: string | null;
  hashtags?: string[];
  video_type: string;
  video: unknown;
  course: unknown;
  lecturer: unknown;
  stats: FeedStats;
  is_liked: boolean;
  is_saved: boolean;
};

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(HighlightFeed)
    private highlightFeedModel: typeof HighlightFeed,
    @InjectModel(FeedInteraction)
    private feedInteractionModel: typeof FeedInteraction,
    @InjectModel(FeedView)
    private feedViewModel: typeof FeedView,
    @InjectModel(FeedComment)
    private feedCommentModel: typeof FeedComment,
    @InjectModel(Video)
    private videoModel: typeof Video,
    @InjectModel(Course)
    private courseModel: typeof Course,
    @InjectModel(User)
    private userModel: typeof User,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) { }

  private readonly ADMIN_ROLE = 1;
  private readonly LECTURER_ROLE = 3;
  private readonly RECOMMEND_CACHE_TTL_SECONDS = 600;
  private readonly PROFILE_TTL_SECONDS = 24 * 60 * 60;
  private readonly SEEN_COOLDOWN_SECONDS = 6 * 60 * 60;
  private readonly RECOMMEND_CACHE_SIZE = 100;
  private readonly ACTIVE_USER_LOOKBACK_MS = 24 * 60 * 60 * 1000;
  private readonly TRENDING_WINDOW_MS = 60 * 60 * 1000;
  private readonly TRENDING_CACHE_TTL_SECONDS = 300;
  private readonly TRENDING_MAX_LIMIT = 50;
  private readonly TRENDING_DEFAULT_LIMIT = 20;

  // ─── Recommendation tuning (centralised so they can be A/B tested) ──────
  // Half-life (in hours) used for time-decay on freshness signal.
  private readonly FRESHNESS_HALF_LIFE_HOURS = 36;
  // Weight applied to the global engagement signal (likes/saves/shares/etc).
  private readonly W_GLOBAL = 1.0;
  // Weight applied to the personalisation signal (course/hashtag affinity).
  private readonly W_PERSONAL = 1.5;
  // Weight applied to the freshness (time decay) signal.
  private readonly W_FRESHNESS = 1.2;
  // Penalty multiplier per repeated view of the same feed item.
  private readonly REPEAT_VIEW_PENALTY = 0.8;
  // Maximum cumulative repeat-view penalty.
  private readonly REPEAT_VIEW_PENALTY_CAP = 3;
  // Exploration: probability of injecting a random fresh item every K slots.
  private readonly EXPLORATION_RATIO = 0.15;
  // Maximum number of consecutive items from the same lecturer/course.
  private readonly MAX_SAME_COURSE_RUN = 2;
  // Window (in hours) used to fetch global engagement signal for ranking.
  private readonly GLOBAL_ENGAGEMENT_WINDOW_HOURS = 7 * 24;

  private parseNumberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private createEmptyFeedStats(): FeedStats {
    return {
      likes: 0,
      saves: 0,
      shares: 0,
      views: 0,
      comments: 0,
    };
  }

  private normalizePercentage(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return Number(value.toFixed(2));
  }

  private resolvePeriodStart(period?: string): Date | undefined {
    if (!period || period === 'all') {
      return undefined;
    }

    const now = Date.now();
    const normalized = period.toLowerCase();
    if (normalized === '7d') {
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
    if (normalized === '30d') {
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    throw new BadRequestException("Invalid period. Supported values: '7d', '30d', 'all'");
  }

  private buildRecommendListKey(userId: number, sessionId: string, courseId?: number): string {
    return `feed:rec:list:${userId}:${sessionId}:${courseId ?? 0}`;
  }

  private buildRecommendSessionKey(userId: number): string {
    return `feed:rec:session:${userId}`;
  }

  private buildProfileKey(userId: number): string {
    return `feed:rec:profile:${userId}`;
  }

  private buildSeenKey(userId: number): string {
    return `feed:rec:seen:${userId}`;
  }

  private buildInteractedUsersKey(): string {
    return 'feed:rec:interacted-users';
  }

  private buildTrendingCacheKey(): string {
    return 'feed:trending:1h';
  }

  private serializeNumberMap(map: Map<number, number>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of map.entries()) {
      result[String(key)] = value;
    }
    return result;
  }

  private deserializeNumberMap(source?: Record<string, number>): Map<number, number> {
    const map = new Map<number, number>();
    if (!source) {
      return map;
    }
    for (const [key, value] of Object.entries(source)) {
      const parsedKey = Number(key);
      if (Number.isFinite(parsedKey)) {
        map.set(parsedKey, Number(value) || 0);
      }
    }
    return map;
  }

  private deserializeStringMap(source?: Record<string, number>): Map<string, number> {
    const map = new Map<string, number>();
    if (!source) {
      return map;
    }
    for (const [key, value] of Object.entries(source)) {
      if (typeof key === 'string') {
        map.set(key, Number(value) || 0);
      }
    }
    return map;
  }

  private async getCachedProfile(userId: number): Promise<{
    courseAffinity: Map<number, number>;
    hashtagAffinity: Map<string, number>;
  } | null> {
    const raw = await this.redisService.get(this.buildProfileKey(userId));
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as {
        courseAffinity?: Record<string, number>;
        hashtagAffinity?: Record<string, number>;
      };
      return {
        courseAffinity: this.deserializeNumberMap(parsed.courseAffinity),
        hashtagAffinity: this.deserializeStringMap(parsed.hashtagAffinity),
      };
    } catch {
      return null;
    }
  }

  private async setCachedProfile(
    userId: number,
    courseAffinity: Map<number, number>,
    hashtagAffinity: Map<string, number>,
  ): Promise<void> {
    const payload = JSON.stringify({
      courseAffinity: this.serializeNumberMap(courseAffinity),
      hashtagAffinity: Object.fromEntries(hashtagAffinity),
    });
    await this.redisService.set(this.buildProfileKey(userId), payload, this.PROFILE_TTL_SECONDS);
  }

  private async getRecentSeenFeedIds(userId: number, limit = 500): Promise<number[]> {
    const now = Date.now();
    const minScore = now - this.SEEN_COOLDOWN_SECONDS * 1000;
    await this.redisService.zRemRangeByScore(this.buildSeenKey(userId), 0, minScore - 1);
    const ids = await this.redisService.zRangeByScore(
      this.buildSeenKey(userId),
      minScore,
      now,
      limit,
    );
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
  }

  private async markFeedSeen(userId: number, feedId: number): Promise<void> {
    await this.redisService.zAdd(this.buildSeenKey(userId), Date.now(), String(feedId));
  }

  private async markUserInteracted(userId: number): Promise<void> {
    await this.redisService.sAdd(this.buildInteractedUsersKey(), [String(userId)]);
  }

  private normalizeSessionId(sessionId?: string): string | undefined {
    if (!sessionId) {
      return undefined;
    }
    const trimmed = sessionId.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private generateRecommendSessionId(): string {
    return randomUUID();
  }

  private async getLatestRecommendSessionId(userId: number): Promise<string | null> {
    return this.redisService.get(this.buildRecommendSessionKey(userId));
  }

  private async setLatestRecommendSessionId(userId: number, sessionId: string): Promise<void> {
    await this.redisService.set(
      this.buildRecommendSessionKey(userId),
      sessionId,
      this.RECOMMEND_CACHE_TTL_SECONDS,
    );
  }

  private async getCachedRecommendList(
    userId: number,
    sessionId: string,
    courseId?: number,
  ): Promise<number[] | null> {
    const raw = await this.redisService.get(this.buildRecommendListKey(userId, sessionId, courseId));
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return null;
      }
      return parsed
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
    } catch {
      return null;
    }
  }

  private async setCachedRecommendList(
    userId: number,
    sessionId: string,
    courseId: number | undefined,
    feedIds: number[],
  ): Promise<void> {
    await this.redisService.set(
      this.buildRecommendListKey(userId, sessionId, courseId),
      JSON.stringify(feedIds),
      this.RECOMMEND_CACHE_TTL_SECONDS,
    );
  }

  private pageFeedIds(feedIds: number[], cursor: number | undefined, limit: number): number[] {
    if (!cursor) {
      return feedIds.slice(0, limit);
    }
    const index = feedIds.indexOf(cursor);
    if (index < 0) {
      return [];
    }
    return feedIds.slice(index + 1, index + 1 + limit);
  }

  private async getStatsAndInteractions(
    feedIds: number[],
    userId: number,
  ): Promise<{
    statsByFeed: Map<number, FeedStats>;
    likedSet: Set<number>;
    savedSet: Set<number>;
  }> {
    const statsByFeed = new Map<number, FeedStats>();
    const likedSet = new Set<number>();
    const savedSet = new Set<number>();

    if (feedIds.length === 0) {
      return { statsByFeed, likedSet, savedSet };
    }

    const [interactionRows, viewRows, commentRows, userInteractionRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedViewModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'views']],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedCommentModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'comments']],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedInteractionModel.findAll({
        where: {
          user_id: userId,
          highlight_id: { [Op.in]: feedIds },
          type: { [Op.in]: [FeedInteractionType.LIKE, FeedInteractionType.SAVE] },
        },
        attributes: ['highlight_id', 'type'],
        raw: true,
      }),
    ]);

    const interactionAggRows = interactionRows as unknown as Array<{
      highlight_id: number;
      likes: string | number;
      saves: string | number;
      shares: string | number;
    }>;
    for (const row of interactionAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) ?? this.createEmptyFeedStats();
      current.likes = Number(row.likes || 0);
      current.saves = Number(row.saves || 0);
      current.shares = Number(row.shares || 0);
      statsByFeed.set(feedId, current);
    }

    const viewAggRows = viewRows as unknown as Array<{ highlight_id: number; views: string | number }>;
    for (const row of viewAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) ?? this.createEmptyFeedStats();
      current.views = Number(row.views || 0);
      statsByFeed.set(feedId, current);
    }

    const commentAggRows = commentRows as unknown as Array<{ highlight_id: number; comments: string | number }>;
    for (const row of commentAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) ?? this.createEmptyFeedStats();
      current.comments = Number(row.comments || 0);
      statsByFeed.set(feedId, current);
    }

    const userInteractionAggRows = userInteractionRows as unknown as Array<{
      highlight_id: number;
      type: FeedInteractionType;
    }>;
    for (const row of userInteractionAggRows) {
      if (row.type === FeedInteractionType.LIKE) {
        likedSet.add(Number(row.highlight_id));
      }
      if (row.type === FeedInteractionType.SAVE) {
        savedSet.add(Number(row.highlight_id));
      }
    }

    return { statsByFeed, likedSet, savedSet };
  }

  private async getStatsOnly(
    feedIds: number[],
  ): Promise<Map<number, FeedStats>> {
    const statsByFeed = new Map<number, FeedStats>();
    if (feedIds.length === 0) {
      return statsByFeed;
    }

    const [interactionRows, viewRows, commentRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedViewModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'views']],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedCommentModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'comments']],
        group: ['highlight_id'],
        raw: true,
      }),
    ]);

    const interactionAggRows = interactionRows as unknown as Array<{
      highlight_id: number;
      likes: string | number;
      saves: string | number;
      shares: string | number;
    }>;
    for (const row of interactionAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) ?? this.createEmptyFeedStats();
      current.likes = Number(row.likes || 0);
      current.saves = Number(row.saves || 0);
      current.shares = Number(row.shares || 0);
      statsByFeed.set(feedId, current);
    }

    const viewAggRows = viewRows as unknown as Array<{ highlight_id: number; views: string | number }>;
    for (const row of viewAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) ?? this.createEmptyFeedStats();
      current.views = Number(row.views || 0);
      statsByFeed.set(feedId, current);
    }

    const commentAggRows = commentRows as unknown as Array<{ highlight_id: number; comments: string | number }>;
    for (const row of commentAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) ?? this.createEmptyFeedStats();
      current.comments = Number(row.comments || 0);
      statsByFeed.set(feedId, current);
    }

    return statsByFeed;
  }

  private async computeTrendingFeedIds(): Promise<number[]> {
    const startDate = new Date(Date.now() - this.TRENDING_WINDOW_MS);

    const feeds = await this.highlightFeedModel.findAll({
      where: { status: HighlightFeedStatus.ACTIVE },
      attributes: ['id'],
      include: [
        {
          model: Course,
          attributes: ['id'],
          where: { status: CourseStatus.PUBLISH },
          required: true,
        },
      ],
      raw: true,
    });

    const feedIds = feeds
      .map((row) => Number((row as { id: number }).id))
      .filter((id) => Number.isFinite(id));

    if (feedIds.length === 0) {
      return [];
    }

    const [interactionRows, viewRows, commentRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: {
          highlight_id: { [Op.in]: feedIds },
          created_at: { [Op.gte]: startDate },
        },
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedViewModel.findAll({
        where: {
          highlight_id: { [Op.in]: feedIds },
          viewed_at: { [Op.gte]: startDate },
        },
        attributes: [
          'highlight_id',
          [fn('COUNT', col('id')), 'views'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedCommentModel.findAll({
        where: {
          highlight_id: { [Op.in]: feedIds },
          created_at: { [Op.gte]: startDate },
        },
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'comments']],
        group: ['highlight_id'],
        raw: true,
      }),
    ]);

    const statsMap = this.buildFeedStatsMap(
      interactionRows as unknown as Array<Record<string, unknown>>,
      viewRows as unknown as Array<Record<string, unknown>>,
      commentRows as unknown as Array<Record<string, unknown>>,
    );

    return feedIds
      .map((feedId) => {
        const stats = statsMap.get(feedId) ?? {
          views: 0,
          uniqueViewers: 0,
          completedViews: 0,
          avgWatchDuration: 0,
          likes: 0,
          saves: 0,
          shares: 0,
          comments: 0,
        };
        const score =
          stats.likes * 3 +
          stats.saves * 4 +
          stats.shares * 5 +
          stats.comments * 2 +
          stats.views * 0.5;
        return { feedId, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.feedId - a.feedId;
      })
      .map((item) => item.feedId);
  }

  async getPublicTrending(
    cursor?: number,
    limit?: number,
  ): Promise<{ data: FeedResponseItem[]; next_cursor: number | null }> {
    const safeLimit = Number.isInteger(limit) && (limit as number) > 0
      ? Math.min(limit as number, this.TRENDING_MAX_LIMIT)
      : this.TRENDING_DEFAULT_LIMIT;

    const cacheKey = this.buildTrendingCacheKey();
    let cachedIds: number[] | null = null;
    let raw: string | null = null;
    try {
      raw = await this.redisService.get(cacheKey);
    } catch (err) {
      // Redis unavailable — fall back to DB compute below instead of failing the request.
      console.warn('Trending cache read failed, falling back to DB', err);
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          cachedIds = parsed
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id));
        }
      } catch {
        cachedIds = null;
      }
    }

    if (!cachedIds || cachedIds.length === 0) {
      cachedIds = await this.computeTrendingFeedIds();
      try {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(cachedIds),
          this.TRENDING_CACHE_TTL_SECONDS,
        );
      } catch (err) {
        // Best-effort cache write; a Redis outage must not crash the request.
        console.warn('Trending cache write failed', err);
      }
    }

    const cursorId = Number.isInteger(cursor) && (cursor as number) > 0
      ? cursor as number
      : undefined;
    const pageIds = this.pageFeedIds(cachedIds, cursorId, safeLimit);

    if (pageIds.length === 0) {
      return { data: [], next_cursor: null };
    }

    const statsByFeed = await this.getStatsOnly(pageIds);
    const data = await this.buildFeedResponse(pageIds, statsByFeed, new Set(), new Set());
    return {
      data,
      next_cursor: data.length === safeLimit ? data[data.length - 1].feed_id : null,
    };
  }

  async getFeedById(
    feedId: number,
    userId?: number,
  ): Promise<{ data: FeedResponseItem; next_cursor: number | null }> {
    const statsAndInteractions = userId
      ? await this.getStatsAndInteractions([feedId], userId)
      : {
        statsByFeed: await this.getStatsOnly([feedId]),
        likedSet: new Set<number>(),
        savedSet: new Set<number>(),
      };

    const data = await this.buildFeedResponse(
      [feedId],
      statsAndInteractions.statsByFeed,
      statsAndInteractions.likedSet,
      statsAndInteractions.savedSet,
    );

    const item = data[0];
    if (!item) {
      throw new NotFoundException('Feed item not found');
    }

    return {
      data: item,
      // next_cursor: item.feed_id,
      next_cursor: null,
    };
  }

  private async buildFeedResponse(
    feedIds: number[],
    statsByFeed: Map<number, FeedStats>,
    likedSet: Set<number>,
    savedSet: Set<number>,
    options?: { requireActive?: boolean; requirePublishedCourse?: boolean },
  ): Promise<FeedResponseItem[]> {
    if (feedIds.length === 0) {
      return [];
    }

    const requireActive = options?.requireActive ?? true;
    const requirePublishedCourse = options?.requirePublishedCourse ?? true;

    const feeds = await this.highlightFeedModel.findAll({
      where: {
        id: { [Op.in]: feedIds },
        ...(requireActive ? { status: HighlightFeedStatus.ACTIVE } : {}),
      },
      include: [
        { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
        {
          model: Course,
          ...(requirePublishedCourse ? { where: { status: CourseStatus.PUBLISH } } : {}),
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
    });

    const feedById = new Map<number, HighlightFeed>();
    for (const feed of feeds) {
      feedById.set(feed.id, feed);
    }

    const data: FeedResponseItem[] = [];
    for (const feedId of feedIds) {
      const feed = feedById.get(feedId);
      if (!feed || !feed.course || !feed.video) {
        continue;
      }
      const stats = statsByFeed.get(feed.id) ?? this.createEmptyFeedStats();
      const { user, ...courseData } = feed.course.toJSON();
      data.push({
        feed_id: feed.id,
        title: feed.title,
        caption: feed.caption ?? null,
        hashtags: feed.hashtags,
        video_type: feed.video.type,
        video: feed.video.toJSON(),
        course: courseData,
        lecturer: user,
        stats,
        is_liked: likedSet.has(feed.id),
        is_saved: savedSet.has(feed.id),
      });
    }

    return data;
  }

  private uniqueFeedIds(feedIds: number[]): number[] {
    const seen = new Set<number>();
    const uniqueFeedIds: number[] = [];

    for (const feedId of feedIds) {
      if (!Number.isFinite(feedId) || seen.has(feedId)) {
        continue;
      }
      seen.add(feedId);
      uniqueFeedIds.push(feedId);
    }

    return uniqueFeedIds;
  }

  async getViewedFeeds(userId: number): Promise<FeedResponseItem[]> {
    const rows = await this.feedViewModel.findAll({
      where: { user_id: userId },
      attributes: ['highlight_id', 'viewed_at'],
      order: [['viewed_at', 'DESC']],
      raw: true,
    });

    const feedIds = this.uniqueFeedIds(
      (rows as Array<{ highlight_id: number }>).map((row) => Number(row.highlight_id)),
    );
    const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(feedIds, userId);
    return this.buildFeedResponse(feedIds, statsByFeed, likedSet, savedSet, {
      requireActive: false,
      requirePublishedCourse: false,
    });
  }

  async getSavedFeeds(userId: number): Promise<FeedResponseItem[]> {
    const rows = await this.feedInteractionModel.findAll({
      where: {
        user_id: userId,
        type: FeedInteractionType.SAVE,
      },
      attributes: ['highlight_id', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true,
    });

    const feedIds = this.uniqueFeedIds(
      (rows as Array<{ highlight_id: number }>).map((row) => Number(row.highlight_id)),
    );
    const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(feedIds, userId);
    return this.buildFeedResponse(feedIds, statsByFeed, likedSet, savedSet, {
      requireActive: false,
      requirePublishedCourse: false,
    });
  }

  /**
   * Offset-paginated list of feeds posted by the current user (lecturer/admin).
   *
   * "Mine" semantics: a feed item is `mine` if the underlying course is owned
   * by the current user (i.e. `course.userId === userId`). All statuses
   * (active/hidden/removed) are returned by default so the lecturer can
   * manage drafts and removed posts — the response includes `status` and
   * `created_at` to support a typical "my posts" management UI.
   *
   * Offset-based pagination (page / pageSize) was chosen because the
   * management UI needs a total count and "jump to page" behaviour — which
   * cursor pagination doesn't naturally support.
   *
   * @param userId    Current lecturer/admin id
   * @param page      1-indexed page number. Default 1.
   * @param pageSize  Page size. Clamped to [1, 100], default 20.
   * @param courseId  Optional course filter.
   * @param status    Optional status filter (`active|hidden|removed`).
   * @param sortBy    Sort column — one of `created_at | id | title`. Default `created_at`.
   * @param order     Sort direction — `asc | desc`. Default `desc`.
   */
  async getMyFeeds(
    userId: number,
    page = 1,
    pageSize = 20,
    courseId?: number,
    status?: HighlightFeedStatus,
    sortBy: 'created_at' | 'id' | 'title' = 'created_at',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<{
    data: Array<FeedResponseItem & {
      status: HighlightFeedStatus;
      created_at: Date | string | null;
    }>;
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safePageSize = Number.isInteger(pageSize) && pageSize > 0
      ? Math.min(pageSize, 100)
      : 20;
    const offset = (safePage - 1) * safePageSize;

    const allowedSortBy: ReadonlySet<string> = new Set(['created_at', 'id', 'title']);
    const sortColumn = allowedSortBy.has(sortBy) ? sortBy : 'created_at';
    const sortDirection = order === 'asc' ? 'ASC' : 'DESC';

    const whereClause: WhereOptions<HighlightFeed> = {
      ...(courseId && Number.isFinite(courseId) && courseId > 0 ? { course_id: courseId } : {}),
      ...(status ? { status } : {}),
    };

    // `findAndCountAll` returns `{ rows, count }`. We use `distinct: true` so
    // the count is on DISTINCT highlight_feed.id even when we join other
    // tables (defensive — HighlightFeed → Course is 1:1 but this future-proofs
    // against adding any 1-to-many include).
    const { rows: feeds, count } = await this.highlightFeedModel.findAndCountAll({
      where: whereClause,
      include: [
        { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
        {
          model: Course,
          required: true,
          // Scope to feeds whose course belongs to the requester. Course
          // status is NOT filtered here — lecturer can see feeds even after
          // they unpublish the course.
          where: { userId },
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [[sortColumn, sortDirection]],
      limit: safePageSize,
      offset,
      distinct: true,
      // `subQuery: false` matters when combining `where` on an associated
      // table with `limit/offset` — otherwise Sequelize applies the limit
      // BEFORE the JOIN and the page can come back short.
      subQuery: false,
    });

    // `findAndCountAll` with `include` may return `count` as an array when the
    // GROUP BY clause is implicit. Normalise.
    const total = typeof count === 'number'
      ? count
      : Array.isArray(count)
        ? (count as Array<{ count: number }>).length
        : 0;
    const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 0;

    if (feeds.length === 0) {
      return {
        data: [],
        pagination: { page: safePage, pageSize: safePageSize, total, totalPages },
      };
    }

    const feedIds = feeds.map((feed) => feed.id);
    const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(feedIds, userId);

    const data = feeds
      .map((feed) => {
        if (!feed.video || !feed.course) {
          return null;
        }
        const stats = statsByFeed.get(feed.id) ?? this.createEmptyFeedStats();
        const { user, ...courseData } = feed.course.toJSON();
        return {
          feed_id: feed.id,
          title: feed.title,
          caption: feed.caption ?? null,
          hashtags: feed.hashtags,
          video_type: feed.video.type,
          video: feed.video.toJSON(),
          course: courseData,
          lecturer: user,
          stats,
          is_liked: likedSet.has(feed.id),
          is_saved: savedSet.has(feed.id),
          status: feed.status,
          created_at: (feed.get('created_at') as Date | string | null) ?? null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      data,
      pagination: { page: safePage, pageSize: safePageSize, total, totalPages },
    };
  }

  private async assertFeedStatsAccess(
    feedId: number,
    requesterUserId: number,
    requesterRole: number,
  ): Promise<HighlightFeed> {
    if (requesterRole !== this.ADMIN_ROLE && requesterRole !== this.LECTURER_ROLE) {
      throw new ForbiddenException('Lecturer or admin permission required');
    }

    const feed = await this.highlightFeedModel.findByPk(feedId, {
      include: [{ model: Course, attributes: ['id', 'name', 'userId'] }],
    });
    if (!feed || !feed.course) {
      throw new NotFoundException('Feed item not found');
    }

    if (requesterRole === this.ADMIN_ROLE) {
      return feed;
    }

    if (feed.course.userId !== requesterUserId) {
      throw new ForbiddenException('You are not allowed to access this feed statistics');
    }

    return feed;
  }

  private buildFeedStatsMap(
    interactionRows: Array<Record<string, unknown>>,
    viewRows: Array<Record<string, unknown>>,
    commentRows: Array<Record<string, unknown>>,
  ): Map<number, {
    views: number;
    uniqueViewers: number;
    completedViews: number;
    avgWatchDuration: number;
    likes: number;
    saves: number;
    shares: number;
    comments: number;
  }> {
    const map = new Map<number, {
      views: number;
      uniqueViewers: number;
      completedViews: number;
      avgWatchDuration: number;
      likes: number;
      saves: number;
      shares: number;
      comments: number;
    }>();

    for (const row of interactionRows) {
      const feedId = this.parseNumberValue(row.highlight_id);
      const current = map.get(feedId) ?? {
        views: 0,
        uniqueViewers: 0,
        completedViews: 0,
        avgWatchDuration: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
      };

      current.likes = this.parseNumberValue(row.likes);
      current.saves = this.parseNumberValue(row.saves);
      current.shares = this.parseNumberValue(row.shares);
      map.set(feedId, current);
    }

    for (const row of viewRows) {
      const feedId = this.parseNumberValue(row.highlight_id);
      const current = map.get(feedId) ?? {
        views: 0,
        uniqueViewers: 0,
        completedViews: 0,
        avgWatchDuration: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
      };

      current.views = this.parseNumberValue(row.views);
      current.uniqueViewers = this.parseNumberValue(row.uniqueViewers);
      current.completedViews = this.parseNumberValue(row.completedViews);
      current.avgWatchDuration = this.parseNumberValue(row.avgWatchDuration);
      map.set(feedId, current);
    }

    for (const row of commentRows) {
      const feedId = this.parseNumberValue(row.highlight_id);
      const current = map.get(feedId) ?? {
        views: 0,
        uniqueViewers: 0,
        completedViews: 0,
        avgWatchDuration: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
      };

      current.comments = this.parseNumberValue(row.comments);
      map.set(feedId, current);
    }

    return map;
  }

  async addToFeed(
    userId: number,
    videoId: number,
    courseId: number,
    title?: string,
    caption?: string,
    hashtags?: string[],
  ) {
    // Check if video exists and user owns it
    const video = await this.videoModel.findByPk(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.user_id !== userId) {
      throw new ForbiddenException('You do not own this video');
    }
    if (!['highlight', 'mascot'].includes(video.type)) {
      throw new BadRequestException('Video type must be highlight or mascot');
    }

    // Check if course exists and user owns it
    const course = await this.courseModel.findByPk(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.userId !== userId) {
      throw new ForbiddenException('You do not own this course');
    }

    // Check if already in feed
    const existing = await this.highlightFeedModel.findOne({
      where: { video_id: videoId },
    });
    if (existing) {
      throw new ConflictException('Video này đã có trên feed.');
    }

    // Create
    const feedItem = await this.highlightFeedModel.create({
      video_id: videoId,
      course_id: courseId,
      title: title || video.name,
      caption: caption?.trim() || null,
      hashtags,
      status: HighlightFeedStatus.HIDDEN,
    });

    return feedItem;
  }

  async getFeed(
    cursor?: number,
    limit = 10,
    userId?: number,
    courseId?: number,
    mode?: string,
    search?: string,
    sessionId?: string,
    hashtag?: string,
  ) {
    if (mode === 'recommended') {
      return this.getRecommendedFeed(cursor, limit, userId, courseId, sessionId, hashtag);
    }

    if (mode !== 'recommended' && mode !== 'search') {
      throw new BadRequestException('get mode must be recommended or search');
    }

    // Query feeds với cursor-based pagination, eager load video + course + lecturer

    const whereClause: WhereOptions<HighlightFeed> = {
      status: HighlightFeedStatus.ACTIVE,
      ...(cursor && { id: { [Op.lt]: cursor } }),
      ...(courseId && { course_id: courseId }),
    };

    const term = search?.trim();

    if (term) {
      const likePattern = `%${term}%`;

      whereClause[Op.or] = [
        { title: { [Op.like]: likePattern } },
        { '$course.name$': { [Op.like]: likePattern } },
        literal(`CAST(HighlightFeed.hashtags AS CHAR) LIKE ${this.highlightFeedModel.sequelize!.escape(likePattern)}`),
      ];
    }

    // Hashtag filter (#javascript hoặc javascript đều hợp lệ).
    // MySQL JSON_CONTAINS(hashtags, JSON_QUOTE(:tag)) → kiểm tra tag có nằm
    // trong JSON array hay không. Khi có cả `?search=` và `?hashtag=` thì
    // bắt buộc match cả hai (AND-kết hợp).
    const hashtagClause = this.buildHashtagWhereLiteral(hashtag);
    if (hashtagClause) {
      const existingAnd = (whereClause[Op.and] as unknown[] | undefined) ?? [];
      whereClause[Op.and] = [...existingAnd, hashtagClause] as any;
    }

    const feeds = await this.highlightFeedModel.findAll({
      where: whereClause,
      include: [
        { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
        {
          model: Course,
          required: true,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }], // lecturer info
        },
      ],
      order: [['id', 'DESC']], // mới nhất trước
      limit,
      ...(term || hashtagClause ? { subQuery: false } : {}),
    });

    // console.log('check data: ', feeds);

    const data = await Promise.all(
      feeds.map(async (feed) => {
        // Fetch stats + interaction status của user song song để tối ưu performance
        const [stats, liked, saved] = await Promise.all([
          this.getFeedBasicStats(feed.id),
          userId
            ? this.feedInteractionModel.findOne({
              where: { user_id: userId, highlight_id: feed.id, type: FeedInteractionType.LIKE },
            })
            : null,
          userId
            ? this.feedInteractionModel.findOne({
              where: { user_id: userId, highlight_id: feed.id, type: FeedInteractionType.SAVE },
            })
            : null,
        ]);

        // Tách user (lecturer) ra khỏi course object trước khi return
        const { user, ...courseData } = feed.course!.toJSON();

        return {
          feed_id: feed.id,
          title: feed.title,
          hashtags: feed.hashtags,
          video_type: feed.video!.type,
          video: feed.video!.toJSON(),  // plain object, bỏ Sequelize metadata
          course: courseData,           // full course info, không kèm user
          lecturer: user,               // lecturer tách riêng cho FE dễ dùng
          stats,
          is_liked: !!liked,
          is_saved: !!saved,
        };
      }),
    );

    return {
      data,
      // Nếu còn data thì trả cursor, FE dùng để load trang tiếp
      next_cursor: data.length === limit ? data[data.length - 1].feed_id : null,
    };
  }

  private async getRecommendedFeed(
    cursor?: number,
    limit = 10,
    userId?: number,
    courseId?: number,
    sessionId?: string,
    hashtag?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User not authenticated for recommendation mode');
    }

    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 20) : 10;

    // Hashtag filter bypass Redis cache: ranked list cache hiện tại không
    // key theo hashtag → để tránh phục vụ kết quả sai, compute lại tại chỗ
    // và filter candidate feeds bằng JSON_CONTAINS.
    const hashtagVariants = this.hashtagQueryVariants(hashtag);

    const normalizedSessionId = this.normalizeSessionId(sessionId);
    let activeSessionId = normalizedSessionId ?? (await this.getLatestRecommendSessionId(userId));
    let cachedList: number[] | null = null;

    if (activeSessionId && hashtagVariants.length === 0) {
      cachedList = await this.getCachedRecommendList(userId, activeSessionId, courseId);
    }

    if (cachedList && cachedList.length > 0) {
      const pageIds = this.pageFeedIds(cachedList, cursor, safeLimit);
      if (pageIds.length === 0) {
        return { data: [], next_cursor: null, session_id: activeSessionId };
      }
      const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(
        pageIds,
        userId,
      );
      const data = await this.buildFeedResponse(pageIds, statsByFeed, likedSet, savedSet);
      if (activeSessionId) {
        await this.setLatestRecommendSessionId(userId, activeSessionId);
      }
      return {
        data,
        next_cursor: data.length === safeLimit ? data[data.length - 1].feed_id : null,
        session_id: activeSessionId,
      };
    }

    const { rankedFeeds, statsByFeed, likedSet, savedSet } = await this.computeRankedCandidates(
      userId,
      courseId,
      hashtag,
    );
    if (!rankedFeeds.length) {
      if (!activeSessionId) {
        activeSessionId = this.generateRecommendSessionId();
      } else if (!normalizedSessionId && (!cachedList || cachedList.length === 0)) {
        activeSessionId = this.generateRecommendSessionId();
      }
      await this.setLatestRecommendSessionId(userId, activeSessionId);
      return { data: [], next_cursor: null, session_id: activeSessionId };
    }

    if (!activeSessionId) {
      activeSessionId = this.generateRecommendSessionId();
    } else if (!normalizedSessionId && (!cachedList || cachedList.length === 0)) {
      activeSessionId = this.generateRecommendSessionId();
    }

    const rankedIds = rankedFeeds.map((item) => item.feed.id);
    // Khi filter hashtag, KHÔNG persist vào cache (cache không key theo tag).
    if (hashtagVariants.length === 0) {
      await this.setCachedRecommendList(userId, activeSessionId, courseId, rankedIds);
    }
    await this.setLatestRecommendSessionId(userId, activeSessionId);

    const pageIds = this.pageFeedIds(rankedIds, cursor, safeLimit);
    const data = await this.buildFeedResponse(pageIds, statsByFeed, likedSet, savedSet);
    return {
      data,
      next_cursor: data.length === safeLimit ? data[data.length - 1].feed_id : null,
      session_id: activeSessionId,
    };
  }

  private normalizeHashtags(hashtags?: unknown): string[] {
    if (!hashtags || !Array.isArray(hashtags)) {
      return [];
    }

    return hashtags
      .filter((tag) => typeof tag === 'string')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
  }

  /**
   * Sinh các biến thể cần OR-match cho 1 tag. Lý do phải sinh nhiều biến thể:
   *  - dữ liệu cũ lưu hỗn hợp: có feed có `#`, có feed không (`"javascript"`
   *    vs `"#javascript"`).
   *  - dữ liệu được FE post lên giữ nguyên case (`"UIUX"`, `"TechnicalSEO"`),
   *    trong khi `JSON_CONTAINS` của MySQL so sánh case-sensitive trên JSON
   *    string. Nếu chỉ search lowercase sẽ miss hết tag camelCase.
   *
   * Trả về set 4 phần tử: { tag, #tag, tag-lower, #tag-lower }. Caller
   * (`buildHashtagWhereLiteral`) sẽ OR chúng trong SQL.
   */
  private hashtagQueryVariants(tag?: string | null): string[] {
    if (!tag) return [];
    const trimmed = tag.trim();
    if (!trimmed) return [];
    const withoutHashOrig = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    if (!withoutHashOrig) return [];
    const withoutHashLower = withoutHashOrig.toLowerCase();

    const variants = new Set<string>();
    variants.add(withoutHashOrig);
    variants.add(`#${withoutHashOrig}`);
    variants.add(withoutHashLower);
    variants.add(`#${withoutHashLower}`);
    return Array.from(variants);
  }

  /**
   * Build literal where-clause cho hashtag filter.
   *
   * Combine 2 chiến lược để chịu được mọi case lưu trong DB:
   *  1. `JSON_CONTAINS(hashtags, JSON_QUOTE(:variant))` cho 4 biến thể đã
   *     normalize — exact match, dùng được multi-valued index nếu MySQL
   *     8.0.17+ (tốc độ tốt nhất).
   *  2. Fallback `JSON_SEARCH(LOWER(CAST(hashtags AS CHAR)), 'one', LOWER(:tag))
   *     IS NOT NULL` — case-insensitive sau khi đã ép cả 2 vế về lowercase,
   *     dùng để bắt các tag camelCase/UPPER lệch mà 4 variant không cover
   *     (tránh false negative khi data lưu cẩu thả).
   *
   * Hai nhánh nối bằng OR. Trả `null` nếu hashtag rỗng → caller bỏ qua filter.
   */
  private buildHashtagWhereLiteral(tag?: string | null): ReturnType<typeof literal> | null {
    const variants = this.hashtagQueryVariants(tag);
    if (variants.length === 0) return null;
    const seq = this.highlightFeedModel.sequelize!;

    const containsParts = variants.map(
      (v) => `JSON_CONTAINS(HighlightFeed.hashtags, JSON_QUOTE(${seq.escape(v)}))`,
    );

    // Lowercase tag gốc (bỏ `#`) để dùng cho nhánh case-insensitive fallback.
    const trimmed = tag!.trim();
    const withoutHashLower = (trimmed.startsWith('#') ? trimmed.slice(1) : trimmed).toLowerCase();
    // Match exact-token sau khi cast JSON → CHAR, dùng JSON_SEARCH (LIKE-rules).
    // Bao quanh bằng dấu ngoặc kép để khỏi match prefix (e.g. "grammar" KHÔNG
    // match "grammarian"). JSON values trong CAST(... AS CHAR) đã có "" sẵn.
    const insensitiveParts = [
      `JSON_SEARCH(LOWER(CAST(HighlightFeed.hashtags AS CHAR)), 'one', ${seq.escape(withoutHashLower)}) IS NOT NULL`,
      `JSON_SEARCH(LOWER(CAST(HighlightFeed.hashtags AS CHAR)), 'one', ${seq.escape('#' + withoutHashLower)}) IS NOT NULL`,
    ];

    return literal(`(${[...containsParts, ...insensitiveParts].join(' OR ')})`);
  }

  /**
   * Top hashtag trong N ngày gần đây + growth so với cửa sổ N ngày liền
   * trước. Trả về `{ items: [{ tag, count, growthPct }] }`.
   *
   * Aggregation trên JS (thay vì JSON_TABLE) để portable hơn — query DB chỉ
   * scan 2 cửa sổ thời gian, mỗi cửa sổ tối đa vài trăm feed ngắn → an toàn
   * cho memory. Nếu volume tăng có thể move sang `JSON_TABLE` (MySQL 8.0+).
   */
  async getTrendingHashtags(
    days = 7,
    limit = 20,
  ): Promise<{ items: Array<{ tag: string; count: number; growthPct: number | null }> }> {
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 90) : 7;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;

    const now = Date.now();
    const windowMs = safeDays * 24 * 60 * 60 * 1000;
    const currentStart = new Date(now - windowMs);
    const previousStart = new Date(now - 2 * windowMs);
    const previousEnd = currentStart;

    const [currentRows, previousRows] = await Promise.all([
      this.highlightFeedModel.findAll({
        where: {
          status: HighlightFeedStatus.ACTIVE,
          created_at: { [Op.gte]: currentStart },
        },
        attributes: ['id', 'hashtags'],
        raw: true,
      }),
      this.highlightFeedModel.findAll({
        where: {
          status: HighlightFeedStatus.ACTIVE,
          created_at: { [Op.gte]: previousStart, [Op.lt]: previousEnd },
        },
        attributes: ['id', 'hashtags'],
        raw: true,
      }),
    ]);

    const tally = (rows: Array<{ hashtags?: unknown }>): Map<string, number> => {
      const counter = new Map<string, number>();
      for (const row of rows) {
        const tags = this.normalizeHashtags(row.hashtags);
        const uniqueInThisFeed = new Set<string>();
        for (const raw of tags) {
          const tag = raw.startsWith('#') ? raw : `#${raw}`;
          if (uniqueInThisFeed.has(tag)) continue; // tránh đếm trùng trong 1 feed
          uniqueInThisFeed.add(tag);
          counter.set(tag, (counter.get(tag) || 0) + 1);
        }
      }
      return counter;
    };

    const currentCount = tally(currentRows as Array<{ hashtags?: unknown }>);
    const previousCount = tally(previousRows as Array<{ hashtags?: unknown }>);

    const items = Array.from(currentCount.entries())
      .map(([tag, count]) => {
        const prev = previousCount.get(tag) ?? 0;
        let growthPct: number | null;
        if (prev === 0) {
          // Không có dữ liệu kỳ trước → không tính growth (FE hiển thị "new").
          growthPct = count > 0 ? null : 0;
        } else {
          growthPct = Number((((count - prev) / prev) * 100).toFixed(2));
        }
        return { tag, count, growthPct };
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.tag.localeCompare(b.tag);
      })
      .slice(0, safeLimit);

    return { items };
  }

  private async invalidateRecommendCache(userId: number, _courseId?: number): Promise<void> {
    // Drop the active session pointer plus any cached ranked lists for this user.
    // Without this the user keeps paginating an out-of-date queue after an
    // interaction, which is a common source of "I liked it but feed didn't
    // change" complaints.
    await this.redisService.del(this.buildRecommendSessionKey(userId));
    const listKeys = await this.redisService.scanKeys(`feed:rec:list:${userId}:*`);
    if (listKeys.length > 0) {
      await this.redisService.delMany(listKeys);
    }
  }

  private async updateProfileAffinity(
    userId: number,
    feed: HighlightFeed,
    weight: number,
  ): Promise<void> {
    const cachedProfile = await this.getCachedProfile(userId);
    const courseAffinity = cachedProfile?.courseAffinity ?? new Map<number, number>();
    const hashtagAffinity = cachedProfile?.hashtagAffinity ?? new Map<string, number>();

    courseAffinity.set(feed.course_id, (courseAffinity.get(feed.course_id) || 0) + weight);
    const tags = this.normalizeHashtags(feed.hashtags);
    for (const tag of tags) {
      hashtagAffinity.set(tag, (hashtagAffinity.get(tag) || 0) + weight);
    }

    await this.setCachedProfile(userId, courseAffinity, hashtagAffinity);
  }

  /**
   * Pre-compute recommendation queues for users who have recently interacted
   * with the feed. Designed to be called by a cron job.
   *
   * Improvements over the previous implementation:
   *  - Acquires a Redis lock so concurrent cron ticks don't trample each other.
   *  - Reuses the existing session id if it's still valid (avoids burning a
   *    fresh sessionId — and a fresh Redis key — every run).
   *  - Processes users with bounded concurrency (8 at a time) instead of
   *    serialising the whole batch.
   *  - Returns lightweight stats for observability.
   */
  async precomputeRecommendedForActiveUsers(options?: {
    concurrency?: number;
    maxBatch?: number;
  }): Promise<{ processed: number; skipped: number }> {
    const lockKey = 'feed:rec:precompute:lock';
    const acquired = await this.redisService.acquireLock(lockKey, 60);
    if (!acquired) {
      return { processed: 0, skipped: 0 };
    }
    try {
      const members = await this.redisService.sMembers(this.buildInteractedUsersKey());
      const userIds = members
        .map((value) => Number(value))
        .filter((id) => Number.isFinite(id) && id > 0);

      if (userIds.length === 0) {
        return { processed: 0, skipped: 0 };
      }

      const maxBatch = options?.maxBatch ?? 500;
      const batch = userIds.slice(0, maxBatch);
      const concurrency = Math.max(1, options?.concurrency ?? 8);
      let processed = 0;
      let skipped = 0;

      const runOne = async (userId: number) => {
        try {
          const existingSessionId = await this.getLatestRecommendSessionId(userId);
          const sessionId = existingSessionId ?? this.generateRecommendSessionId();
          const { rankedFeeds } = await this.computeRankedCandidates(userId);
          const rankedIds = rankedFeeds.map((item) => item.feed.id);
          if (rankedIds.length === 0) {
            skipped += 1;
            return;
          }
          await this.setCachedRecommendList(userId, sessionId, undefined, rankedIds);
          await this.setLatestRecommendSessionId(userId, sessionId);
          processed += 1;
        } catch (err) {
          skipped += 1;
          // Swallow per-user errors so one bad profile doesn't abort the batch.

          console.error('precompute failed for user', userId, err);
        }
      };

      // Bounded-concurrency map
      const queue = [...batch];
      const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next === undefined) {
            break;
          }
          await runOne(next);
        }
      });
      await Promise.all(workers);

      // Drop the users we processed from the queue so they won't be retried
      // until they interact again.
      await this.redisService.sRem(
        this.buildInteractedUsersKey(),
        batch.map(String),
      );

      return { processed, skipped };
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  /**
   * Refresh the public trending cache. Safe to call from a cron job — uses a
   * lock so concurrent ticks don't recompute the same window twice.
   */
  async refreshTrendingCache(): Promise<{ count: number } | { skipped: true }> {
    const lockKey = 'feed:trending:refresh:lock';
    const acquired = await this.redisService.acquireLock(lockKey, 30);
    if (!acquired) {
      return { skipped: true };
    }
    try {
      const ids = await this.computeTrendingFeedIds();
      await this.redisService.set(
        this.buildTrendingCacheKey(),
        JSON.stringify(ids),
        this.TRENDING_CACHE_TTL_SECONDS,
      );
      return { count: ids.length };
    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  private async getFeedBasicStats(feedId: number) {
    const [likes, saves, views] = await Promise.all([
      this.feedInteractionModel.count({
        where: { highlight_id: feedId, type: FeedInteractionType.LIKE },
      }),
      this.feedInteractionModel.count({
        where: { highlight_id: feedId, type: FeedInteractionType.SAVE },
      }),
      this.feedViewModel.count({
        where: { highlight_id: feedId },
      }),
    ]);
    return { views, likes, saves };
  }

  /**
   * Fetch richer global stats (likes / saves / shares / views / comments /
   * completion-rate) for a list of feed ids, scoped to a recency window.
   *
   * This is used by the ranker so popularity is measured over the last N hours
   * (default: 7 days) rather than lifetime — preventing "first-ever feed item
   * dominates forever" failure mode.
   */
  private async getRankingSignals(
    feedIds: number[],
    windowHours: number,
  ): Promise<Map<number, {
    likes: number;
    saves: number;
    shares: number;
    views: number;
    comments: number;
    completedViews: number;
    avgWatchDuration: number;
  }>> {
    const map = new Map<number, {
      likes: number;
      saves: number;
      shares: number;
      views: number;
      comments: number;
      completedViews: number;
      avgWatchDuration: number;
    }>();
    if (feedIds.length === 0) {
      return map;
    }

    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const [interactionRows, viewRows, commentRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: {
          highlight_id: { [Op.in]: feedIds },
          created_at: { [Op.gte]: since },
        },
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedViewModel.findAll({
        where: {
          highlight_id: { [Op.in]: feedIds },
          viewed_at: { [Op.gte]: since },
        },
        attributes: [
          'highlight_id',
          [fn('COUNT', col('id')), 'views'],
          [fn('SUM', literal('CASE WHEN completed = true THEN 1 ELSE 0 END')), 'completedViews'],
          [fn('AVG', col('watch_duration')), 'avgWatchDuration'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedCommentModel.findAll({
        where: {
          highlight_id: { [Op.in]: feedIds },
          created_at: { [Op.gte]: since },
        },
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'comments']],
        group: ['highlight_id'],
        raw: true,
      }),
    ]);

    const ensure = (id: number) => {
      const existing = map.get(id);
      if (existing) {
        return existing;
      }
      const fresh = {
        likes: 0,
        saves: 0,
        shares: 0,
        views: 0,
        comments: 0,
        completedViews: 0,
        avgWatchDuration: 0,
      };
      map.set(id, fresh);
      return fresh;
    };

    for (const row of interactionRows as unknown as Array<Record<string, unknown>>) {
      const id = this.parseNumberValue(row.highlight_id);
      const entry = ensure(id);
      entry.likes = this.parseNumberValue(row.likes);
      entry.saves = this.parseNumberValue(row.saves);
      entry.shares = this.parseNumberValue(row.shares);
    }
    for (const row of viewRows as unknown as Array<Record<string, unknown>>) {
      const id = this.parseNumberValue(row.highlight_id);
      const entry = ensure(id);
      entry.views = this.parseNumberValue(row.views);
      entry.completedViews = this.parseNumberValue(row.completedViews);
      entry.avgWatchDuration = this.parseNumberValue(row.avgWatchDuration);
    }
    for (const row of commentRows as unknown as Array<Record<string, unknown>>) {
      const id = this.parseNumberValue(row.highlight_id);
      const entry = ensure(id);
      entry.comments = this.parseNumberValue(row.comments);
    }

    return map;
  }

  /**
   * Standard "Reddit/Hacker News"-style time decay using a half-life.
   * Older items decay smoothly toward 0 instead of being a hard cutoff.
   */
  private freshnessScore(createdAt?: Date | string | null): number {
    if (!createdAt) {
      return 0;
    }
    const ts = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
    if (!Number.isFinite(ts)) {
      return 0;
    }
    const ageHours = Math.max((Date.now() - ts) / (60 * 60 * 1000), 0);
    // 0.5 ^ (ageHours / halfLife) → 1.0 brand-new, 0.5 after one half-life, etc.
    return Math.pow(0.5, ageHours / this.FRESHNESS_HALF_LIFE_HOURS);
  }

  /**
   * Wilson-style smoothed "engagement per view" so we don't reward a feed that
   * got 1 like out of 1 view the same as 1000 likes out of 1000 views.
   * Uses Laplace smoothing instead of full Wilson interval to keep it cheap.
   */
  private engagementRate(positives: number, total: number, prior = 50): number {
    return (positives + 1) / (total + prior);
  }

  /**
   * Greedy re-ranker that avoids showing >MAX_SAME_COURSE_RUN consecutive
   * items from the same course/lecturer. This produces a TikTok-like
   * interleaved feed instead of a "5 in a row from one creator" block.
   */
  private diversifyByCourse<T extends { feed: HighlightFeed }>(items: T[]): T[] {
    if (items.length <= 2) {
      return items;
    }
    const result: T[] = [];
    const remaining = [...items];
    let lastCourse: number | null = null;
    let runLen = 0;
    while (remaining.length > 0) {
      let pickIndex = 0;
      if (lastCourse !== null && runLen >= this.MAX_SAME_COURSE_RUN) {
        const altIndex = remaining.findIndex((it) => it.feed.course_id !== lastCourse);
        if (altIndex >= 0) {
          pickIndex = altIndex;
        }
      }
      const picked = remaining.splice(pickIndex, 1)[0];
      if (picked.feed.course_id === lastCourse) {
        runLen += 1;
      } else {
        lastCourse = picked.feed.course_id;
        runLen = 1;
      }
      result.push(picked);
    }
    return result;
  }

  /**
   * Mix a small fraction of "exploration" items (random, fresh, unseen) into
   * the top of the ranked list so the user doesn't get stuck in a filter
   * bubble. Cf. epsilon-greedy bandit.
   */
  private injectExploration<T extends { feed: HighlightFeed; explorationScore: number }>(
    ranked: T[],
  ): T[] {
    if (ranked.length <= 4 || this.EXPLORATION_RATIO <= 0) {
      return ranked;
    }
    const everyN = Math.max(2, Math.round(1 / this.EXPLORATION_RATIO));
    // Items the ranker did NOT put in the top — pick the freshest among them
    // and splice them in every `everyN` slots.
    const topCutoff = Math.min(ranked.length, Math.ceil(ranked.length / 2));
    const tail = ranked.slice(topCutoff).sort((a, b) => b.explorationScore - a.explorationScore);
    if (tail.length === 0) {
      return ranked;
    }
    const result = ranked.slice(0, topCutoff);
    let tailCursor = 0;
    const finalList: T[] = [];
    for (let i = 0; i < result.length; i += 1) {
      finalList.push(result[i]);
      if ((i + 1) % everyN === 0 && tailCursor < tail.length) {
        finalList.push(tail[tailCursor]);
        tailCursor += 1;
      }
    }
    // Append leftover tail (already de-duplicated by index in finalList).
    const inserted = new Set(finalList.map((it) => it.feed.id));
    for (const item of tail.slice(tailCursor)) {
      if (!inserted.has(item.feed.id)) {
        finalList.push(item);
      }
    }
    return finalList;
  }

  private async computeRankedCandidates(
    userId: number,
    courseId?: number,
    hashtag?: string,
  ): Promise<{
    rankedFeeds: Array<{ feed: HighlightFeed; stats: FeedStats }>;
    statsByFeed: Map<number, FeedStats>;
    likedSet: Set<number>;
    savedSet: Set<number>;
    viewedCount: Map<number, number>;
    courseAffinity: Map<number, number>;
    hashtagAffinity: Map<string, number>;
  }> {
    // ─── 1. Build / refresh the user behavioural profile ─────────────────
    const cachedProfile = await this.getCachedProfile(userId);
    const userViews = await this.feedViewModel.findAll({
      where: { user_id: userId },
      include: [{ model: HighlightFeed, attributes: ['id', 'course_id', 'hashtags'] }],
      order: [['id', 'DESC']],
      limit: 200,
    });

    const courseAffinity = cachedProfile?.courseAffinity ?? new Map<number, number>();
    const hashtagAffinity = cachedProfile?.hashtagAffinity ?? new Map<string, number>();
    const viewedCount = new Map<number, number>();

    if (!cachedProfile) {
      // Cold-start: replay recent views to seed affinities.
      for (const view of userViews) {
        const highlight = view.highlight;
        if (!highlight) {
          continue;
        }
        const behaviorWeight =
          (view.completed ? 2 : 1) + Math.min((view.watch_duration || 0) / 30, 2);
        viewedCount.set(highlight.id, (viewedCount.get(highlight.id) || 0) + 1);
        courseAffinity.set(
          highlight.course_id,
          (courseAffinity.get(highlight.course_id) || 0) + behaviorWeight,
        );
        const tags = this.normalizeHashtags(highlight.hashtags);
        for (const tag of tags) {
          hashtagAffinity.set(tag, (hashtagAffinity.get(tag) || 0) + behaviorWeight);
        }
      }
      await this.setCachedProfile(userId, courseAffinity, hashtagAffinity);
    } else {
      for (const view of userViews) {
        const highlight = view.highlight;
        if (!highlight) {
          continue;
        }
        viewedCount.set(highlight.id, (viewedCount.get(highlight.id) || 0) + 1);
      }
    }

    // Pre-compute affinity normalisers so the personal score is bounded.
    const maxCourseAffinity = Math.max(1, ...Array.from(courseAffinity.values()));
    const maxHashtagAffinity = Math.max(1, ...Array.from(hashtagAffinity.values()));

    // ─── 2. Fetch candidate feeds (unseen first, with a relaxed fallback) ─
    const seenIds = await this.getRecentSeenFeedIds(userId, 1000);
    const hashtagClause = this.buildHashtagWhereLiteral(hashtag);
    const baseWhere = {
      status: HighlightFeedStatus.ACTIVE,
      ...(courseId && { course_id: courseId }),
      ...(hashtagClause ? { [Op.and]: [hashtagClause] } : {}),
    } as Record<string, unknown>;

    const whereWithSeen = {
      ...baseWhere,
      ...(seenIds.length ? { id: { [Op.notIn]: seenIds } } : {}),
    } as Record<string, unknown>;

    let candidateFeeds = await this.highlightFeedModel.findAll({
      where: whereWithSeen,
      include: [
        { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
        {
          model: Course,
          where: { status: CourseStatus.PUBLISH },
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [['id', 'DESC']],
      limit: this.RECOMMEND_CACHE_SIZE,
    });

    if (candidateFeeds.length < 10) {
      candidateFeeds = await this.highlightFeedModel.findAll({
        where: baseWhere,
        include: [
          { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
          {
            model: Course,
            where: { status: CourseStatus.PUBLISH },
            include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
          },
        ],
        order: [['id', 'DESC']],
        limit: this.RECOMMEND_CACHE_SIZE,
      });
    }

    // ─── 3. Gather signals (lifetime user-state + window-scoped popularity) ─
    const feedIds = candidateFeeds.map((feed) => feed.id);
    const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(feedIds, userId);
    const signals = await this.getRankingSignals(feedIds, this.GLOBAL_ENGAGEMENT_WINDOW_HOURS);

    // Normalise the lifetime "views" so a global engagement score is in a
    // similar range to the personal/freshness signals.
    const allViewCounts = Array.from(statsByFeed.values()).map((s) => s.views);
    const maxViews = Math.max(1, ...allViewCounts);

    // ─── 4. Score every candidate ─────────────────────────────────────────
    const scored = candidateFeeds.map((feed) => {
      const stats = statsByFeed.get(feed.id) ?? this.createEmptyFeedStats();
      const sig = signals.get(feed.id) ?? {
        likes: 0,
        saves: 0,
        shares: 0,
        views: 0,
        comments: 0,
        completedViews: 0,
        avgWatchDuration: 0,
      };

      // 4a. Global popularity — Wilson-smoothed engagement rate, so 5 likes
      //     out of 10 views beats 5 likes out of 1000 views.
      const positives = sig.likes + sig.saves * 1.5 + sig.shares * 2 + sig.comments * 1.2;
      const engagement = this.engagementRate(positives, Math.max(sig.views, 1));
      // Completion rate (0..1) — strong signal that a short video is "good".
      const completionRate = sig.views > 0 ? Math.min(sig.completedViews / sig.views, 1) : 0;
      // log-scaled raw popularity to avoid runaway scores from viral items.
      const popularity = Math.log10(1 + sig.views + sig.likes * 2 + sig.saves * 3 + sig.shares * 4);
      const globalScore = engagement * 5 + completionRate * 3 + popularity;

      // 4b. Personalisation — bounded to [0..1] each so the weights mean
      //     something across users with very different histories.
      const courseScore = (courseAffinity.get(feed.course_id) || 0) / maxCourseAffinity;
      const tags = this.normalizeHashtags(feed.hashtags);
      const tagScoreRaw = tags.reduce((sum, tag) => sum + (hashtagAffinity.get(tag) || 0), 0);
      // Average tag affinity per matching tag, then normalise.
      const tagScore = tags.length > 0
        ? (tagScoreRaw / tags.length) / maxHashtagAffinity
        : 0;
      const personalScore = courseScore * 0.7 + tagScore * 0.3;

      // 4c. Freshness with smooth time-decay.
      const fresh = this.freshnessScore(feed.get('created_at') as Date | undefined);

      // 4d. Repeat-view penalty — cap so a user can still see something they
      //     liked again after the cool-down.
      const repeatedViewPenalty = Math.min(
        (viewedCount.get(feed.id) || 0) * this.REPEAT_VIEW_PENALTY,
        this.REPEAT_VIEW_PENALTY_CAP,
      );

      // 4e. Normalised view-count factor (mild boost for already-popular items).
      const viewBoost = Math.log10(1 + stats.views) / Math.log10(1 + maxViews);

      const recommendationScore =
        this.W_GLOBAL * globalScore +
        this.W_PERSONAL * personalScore +
        this.W_FRESHNESS * fresh +
        0.3 * viewBoost -
        repeatedViewPenalty;

      // explorationScore: fresh items the ranker did NOT prioritise. We pick
      // candidates whose personal score is low but freshness is high.
      const explorationScore = fresh * 2 - personalScore;

      return { feed, stats, recommendationScore, explorationScore };
    });

    // ─── 5. Sort, inject exploration, diversify by course ────────────────
    scored.sort((a, b) => {
      if (b.recommendationScore !== a.recommendationScore) {
        return b.recommendationScore - a.recommendationScore;
      }
      return b.feed.id - a.feed.id;
    });

    const explored = this.injectExploration(scored);
    const diversified = this.diversifyByCourse(explored);

    const rankedFeeds = diversified.map(({ feed, stats }) => ({ feed, stats }));

    return {
      rankedFeeds,
      statsByFeed,
      likedSet,
      savedSet,
      viewedCount,
      courseAffinity,
      hashtagAffinity,
    };
  }

  async getFeedDetailStats(feedId: number, requesterUserId: number, requesterRole: number) {
    const feed = await this.assertFeedStatsAccess(feedId, requesterUserId, requesterRole);

    const [interactionRows, viewAgg, commentCount] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: { highlight_id: feedId },
        attributes: [
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        raw: true,
      }),
      this.feedViewModel.findOne({
        where: { highlight_id: feedId },
        attributes: [
          [fn('COUNT', col('id')), 'views'],
          [fn('COUNT', fn('DISTINCT', col('user_id'))), 'uniqueViewers'],
          [fn('SUM', literal('CASE WHEN completed = true THEN 1 ELSE 0 END')), 'completedViews'],
          [fn('AVG', col('watch_duration')), 'avgWatchDuration'],
        ],
        raw: true,
      }),
      this.feedCommentModel.count({ where: { highlight_id: feedId } }),
    ]);

    const interactionAgg = (interactionRows[0] ?? {}) as unknown as Record<string, unknown>;
    const views = this.parseNumberValue((viewAgg as Record<string, unknown> | null)?.views);
    const completedViews = this.parseNumberValue(
      (viewAgg as Record<string, unknown> | null)?.completedViews,
    );

    const completionRate = views > 0 ? (completedViews / views) * 100 : 0;
    const likes = this.parseNumberValue(interactionAgg.likes);
    const saves = this.parseNumberValue(interactionAgg.saves);
    const shares = this.parseNumberValue(interactionAgg.shares);

    return {
      feedId: feed.id,
      title: feed.title,
      caption: feed.caption ?? null,
      course: {
        id: feed.course.id,
        name: feed.course.name,
      },
      stats: {
        views,
        uniqueViewers: this.parseNumberValue(
          (viewAgg as Record<string, unknown> | null)?.uniqueViewers,
        ),
        completedViews,
        completionRate: this.normalizePercentage(completionRate),
        averageWatchDuration: this.normalizePercentage(
          this.parseNumberValue((viewAgg as Record<string, unknown> | null)?.avgWatchDuration),
        ),
        likes,
        saves,
        shares,
        comments: commentCount,
      },
    };
  }

  async getCreatorStats(
    requesterUserId: number,
    requesterRole: number,
    period?: string,
    limit?: number,
  ) {
    if (requesterRole !== this.ADMIN_ROLE && requesterRole !== this.LECTURER_ROLE) {
      throw new ForbiddenException('Lecturer or admin permission required');
    }

    const safeLimit = Number.isInteger(limit) && (limit as number) > 0
      ? Math.min(limit as number, 100)
      : 20;
    const startDate = this.resolvePeriodStart(period);

    const feeds = await this.highlightFeedModel.findAll({
      where: {
        ...(startDate && { created_at: { [Op.gte]: startDate } }),
      } as any,
      include: [
        {
          model: Course,
          attributes: ['id', 'name', 'userId'],
          where: requesterRole === this.LECTURER_ROLE ? { userId: requesterUserId } : undefined,
          required: true,
        },
      ],
      order: [['id', 'DESC']],
      limit: safeLimit,
    });

    const feedIds = feeds.map((feed) => feed.id);
    if (feedIds.length === 0) {
      return {
        summary: {
          totalFeeds: 0,
          views: 0,
          likes: 0,
          saves: 0,
          shares: 0,
          comments: 0,
          completionRate: 0,
        },
        data: [],
      };
    }

    const interactionWhere = {
      highlight_id: { [Op.in]: feedIds },
      ...(startDate && { created_at: { [Op.gte]: startDate } }),
    };
    const viewWhere = {
      highlight_id: { [Op.in]: feedIds },
      ...(startDate && { viewed_at: { [Op.gte]: startDate } }),
    };
    const commentWhere = {
      highlight_id: { [Op.in]: feedIds },
      ...(startDate && { created_at: { [Op.gte]: startDate } }),
    };

    const [interactionRows, viewRows, commentRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: interactionWhere as any,
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedViewModel.findAll({
        where: viewWhere as any,
        attributes: [
          'highlight_id',
          [fn('COUNT', col('id')), 'views'],
          [fn('COUNT', fn('DISTINCT', col('user_id'))), 'uniqueViewers'],
          [fn('SUM', literal('CASE WHEN completed = true THEN 1 ELSE 0 END')), 'completedViews'],
          [fn('AVG', col('watch_duration')), 'avgWatchDuration'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedCommentModel.findAll({
        where: commentWhere as any,
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'comments']],
        group: ['highlight_id'],
        raw: true,
      }),
    ]);

    const statsMap = this.buildFeedStatsMap(
      interactionRows as unknown as Array<Record<string, unknown>>,
      viewRows as unknown as Array<Record<string, unknown>>,
      commentRows as unknown as Array<Record<string, unknown>>,
    );

    const data = feeds.map((feed) => {
      const stats = statsMap.get(feed.id) ?? {
        views: 0,
        uniqueViewers: 0,
        completedViews: 0,
        avgWatchDuration: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
      };
      const completionRate =
        stats.views > 0 ? (stats.completedViews / stats.views) * 100 : 0;
      const engagementRate =
        stats.views > 0
          ? ((stats.likes + stats.saves + stats.shares + stats.comments) / stats.views) * 100
          : 0;

      return {
        feedId: feed.id,
        title: feed.title,
        caption: feed.caption ?? null,
        course: {
          id: feed.course.id,
          name: feed.course.name,
        },
        stats: {
          views: stats.views,
          uniqueViewers: stats.uniqueViewers,
          completedViews: stats.completedViews,
          completionRate: this.normalizePercentage(completionRate),
          averageWatchDuration: this.normalizePercentage(stats.avgWatchDuration),
          likes: stats.likes,
          saves: stats.saves,
          shares: stats.shares,
          comments: stats.comments,
          engagementRate: this.normalizePercentage(engagementRate),
        },
      };
    });

    const summary = data.reduce(
      (acc, item) => {
        acc.views += item.stats.views;
        acc.likes += item.stats.likes;
        acc.saves += item.stats.saves;
        acc.shares += item.stats.shares;
        acc.comments += item.stats.comments;
        acc.completedViews += item.stats.completedViews;
        return acc;
      },
      {
        totalFeeds: data.length,
        views: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        comments: 0,
        completedViews: 0,
      },
    );

    return {
      summary: {
        totalFeeds: summary.totalFeeds,
        views: summary.views,
        likes: summary.likes,
        saves: summary.saves,
        shares: summary.shares,
        comments: summary.comments,
        completionRate: this.normalizePercentage(
          summary.views > 0 ? (summary.completedViews / summary.views) * 100 : 0,
        ),
      },
      data,
    };
  }

  async getTrendingStats(
    requesterUserId: number,
    requesterRole: number,
    period?: string,
    limit?: number,
  ) {
    if (requesterRole !== this.ADMIN_ROLE && requesterRole !== this.LECTURER_ROLE) {
      throw new ForbiddenException('Lecturer or admin permission required');
    }

    const safeLimit = Number.isInteger(limit) && (limit as number) > 0
      ? Math.min(limit as number, 100)
      : 20;
    const startDate = this.resolvePeriodStart(period);

    const feeds = await this.highlightFeedModel.findAll({
      where: { status: HighlightFeedStatus.ACTIVE },
      include: [
        {
          model: Course,
          attributes: ['id', 'name', 'userId'],
          where: requesterRole === this.LECTURER_ROLE ? { userId: requesterUserId } : undefined,
          required: true,
        },
      ],
      order: [['id', 'DESC']],
      limit: safeLimit * 3,
    });

    const feedIds = feeds.map((feed) => feed.id);
    if (feedIds.length === 0) {
      return {
        period: period ?? 'all',
        data: [],
      };
    }

    const interactionWhere = {
      highlight_id: { [Op.in]: feedIds },
      ...(startDate && { created_at: { [Op.gte]: startDate } }),
    };
    const viewWhere = {
      highlight_id: { [Op.in]: feedIds },
      ...(startDate && { viewed_at: { [Op.gte]: startDate } }),
    };
    const commentWhere = {
      highlight_id: { [Op.in]: feedIds },
      ...(startDate && { created_at: { [Op.gte]: startDate } }),
    };

    const [interactionRows, viewRows, commentRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: interactionWhere as any,
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
          [fn('SUM', literal("CASE WHEN type = 'share' THEN 1 ELSE 0 END")), 'shares'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedViewModel.findAll({
        where: viewWhere as any,
        attributes: [
          'highlight_id',
          [fn('COUNT', col('id')), 'views'],
          [fn('COUNT', fn('DISTINCT', col('user_id'))), 'uniqueViewers'],
          [fn('SUM', literal('CASE WHEN completed = true THEN 1 ELSE 0 END')), 'completedViews'],
          [fn('AVG', col('watch_duration')), 'avgWatchDuration'],
        ],
        group: ['highlight_id'],
        raw: true,
      }),
      this.feedCommentModel.findAll({
        where: commentWhere as any,
        attributes: ['highlight_id', [fn('COUNT', col('id')), 'comments']],
        group: ['highlight_id'],
        raw: true,
      }),
    ]);

    const statsMap = this.buildFeedStatsMap(
      interactionRows as unknown as Array<Record<string, unknown>>,
      viewRows as unknown as Array<Record<string, unknown>>,
      commentRows as unknown as Array<Record<string, unknown>>,
    );

    const ranked = feeds
      .map((feed) => {
        const stats = statsMap.get(feed.id) ?? {
          views: 0,
          uniqueViewers: 0,
          completedViews: 0,
          avgWatchDuration: 0,
          likes: 0,
          saves: 0,
          shares: 0,
          comments: 0,
        };
        const completionRate =
          stats.views > 0 ? (stats.completedViews / stats.views) * 100 : 0;
        const score =
          stats.likes * 3 +
          stats.saves * 4 +
          stats.shares * 5 +
          stats.comments * 2 +
          stats.views * 0.5 +
          completionRate * 2;

        return {
          feedId: feed.id,
          title: feed.title,
          caption: feed.caption ?? null,
          course: {
            id: feed.course.id,
            name: feed.course.name,
          },
          stats: {
            views: stats.views,
            uniqueViewers: stats.uniqueViewers,
            completedViews: stats.completedViews,
            completionRate: this.normalizePercentage(completionRate),
            averageWatchDuration: this.normalizePercentage(stats.avgWatchDuration),
            likes: stats.likes,
            saves: stats.saves,
            shares: stats.shares,
            comments: stats.comments,
            score: this.normalizePercentage(score),
          },
        };
      })
      .sort((a, b) => b.stats.score - a.stats.score)
      .slice(0, safeLimit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return {
      period: period ?? 'all',
      data: ranked,
    };
  }

  private async validateFeedCommentTarget(feedId: number): Promise<void> {
    const feed = await this.highlightFeedModel.findByPk(feedId);
    if (!feed || feed.status === HighlightFeedStatus.REMOVED) {
      throw new NotFoundException('Feed item not found');
    }
  }

  private mapCommentResponse(comment: FeedComment, userId?: number, totalNestedCmt?: number) {
    return {
      id: comment.id,
      content: comment.content,
      origin_cmt: comment.origin_cmt ?? null,
      created_at: comment.get('created_at'),
      updated_at: comment.get('updated_at'),
      commenter: comment.user,
      is_owner: !!userId && comment.user_id === userId,
      ...(typeof totalNestedCmt === 'number' ? { total_nested_cmt: totalNestedCmt } : {}),
    };
  }

  private buildFeedRedirectUrl(feedId: number): string {
    return `/newsfeed?videoId=${feedId}`;
  }

  private async notifyFeedLiked(userId: number, feed: HighlightFeed): Promise<void> {
    try {
      const feedWithCourse = await this.highlightFeedModel.findByPk(feed.id, {
        include: [{ model: Course, attributes: ['id', 'userId'] }],
      });
      const feedOwnerId = feedWithCourse?.course?.userId;
      if (feedOwnerId == null || feedOwnerId === userId) return;

      const user = await this.userModel.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName'],
      });
      const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

      await this.notificationService.createAndEmit({
        userId: feedOwnerId,
        eventType: NotificationEventType.FEED_LIKE_CREATED,
        sseEventType: NotificationSseEventType.NOTIFY_CREATED,
        title: 'New like on your feed',
        message: fullName ? `${fullName} liked your post` : 'Someone liked your post',
        sourceType: NotificationSourceType.FEED,
        sourceId: feed.id,
        payload: {
          feedId: feed.id,
          actorUserId: userId,
          redirectUrl: this.buildFeedRedirectUrl(feed.id),
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[feed] failed to create like notification', err);
    }
  }

  async interactWithFeed(userId: number, feedId: number, type: FeedInteractionType) {
    const feed = await this.highlightFeedModel.findByPk(feedId);
    if (!feed || feed.status !== HighlightFeedStatus.ACTIVE) {
      throw new NotFoundException('Feed item not found');
    }

    if (type === FeedInteractionType.SHARE) {
      // Always insert for share
      await this.feedInteractionModel.create({
        user_id: userId,
        highlight_id: feedId,
        type,
      });
      await this.markUserInteracted(userId);
      return { type, active: true };
    } else {
      // Toggle for like/save
      const existing = await this.feedInteractionModel.findOne({
        where: { user_id: userId, highlight_id: feedId, type },
      });
      if (existing) {
        await existing.destroy();
        await this.invalidateRecommendCache(userId, feed.course_id);
        await this.markUserInteracted(userId);
        return { type, active: false };
      } else {
        await this.feedInteractionModel.create({
          user_id: userId,
          highlight_id: feedId,
          type,
        });
        const weight = type === FeedInteractionType.SAVE ? 2 : 1.2;
        await this.updateProfileAffinity(userId, feed, weight);
        await this.invalidateRecommendCache(userId, feed.course_id);
        await this.markUserInteracted(userId);
        if (type === FeedInteractionType.LIKE) {
          await this.notifyFeedLiked(userId, feed);
        }
        return { type, active: true };
      }
    }
  }

  async recordView(userId: number, feedId: number, watchDuration: number, completed: boolean) {
    const feed = await this.highlightFeedModel.findByPk(feedId);
    if (!feed || feed.status !== HighlightFeedStatus.ACTIVE) {
      throw new NotFoundException('Feed item not found');
    }

    if (watchDuration < 0) {
      throw new BadRequestException('Invalid watch duration');
    }

    await this.feedViewModel.create({
      user_id: userId,
      highlight_id: feedId,
      watch_duration: watchDuration,
      completed,
    });
    const viewWeight = (completed ? 2 : 1) + Math.min((watchDuration || 0) / 30, 2);
    await this.updateProfileAffinity(userId, feed, viewWeight);
    await this.markFeedSeen(userId, feedId);
    await this.invalidateRecommendCache(userId, feed.course_id);
    await this.markUserInteracted(userId);
    return { recorded: true };
  }

  async updateFeed(
    userId: number,
    feedId: number,
    title?: string,
    caption?: string,
    hashtags?: string[],
    status?: string,
  ) {
    // Get feed with course info
    const feed = await this.highlightFeedModel.findByPk(feedId, {
      include: [{ model: Course }],
    });
    if (!feed) {
      throw new NotFoundException('Feed item not found');
    }

    // Check ownership - user must own the course
    if (feed.course.userId !== userId) {
      throw new ForbiddenException('You do not own this feed');
    }

    // If updating to ACTIVE status, course must be PUBLISHED
    if (status && status === HighlightFeedStatus.ACTIVE && feed.course.status !== CourseStatus.PUBLISH) {
      throw new BadRequestException('Course must be published to activate feed item');
    }

    // Update feed fields
    if (title !== undefined) {
      feed.title = title;
    }
    if (caption !== undefined) {
      feed.caption = caption?.trim() || null;
    }
    if (hashtags !== undefined) {
      feed.hashtags = hashtags;
    }
    if (status !== undefined) {
      feed.status = status as HighlightFeedStatus;
    }

    await feed.save();
    return feed;
  }

  async createComment(userId: number, feedId: number, content: string, originCmt?: number | null) {
    await this.validateFeedCommentTarget(feedId);

    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Comment content cannot be empty');
    }
    if (trimmedContent.length > 1000) {
      throw new BadRequestException('Comment content must be 1000 characters or less');
    }

    let normalizedOriginCmt: number | null = null;
    let parentComment: FeedComment | null = null;
    if (Number.isInteger(originCmt) && (originCmt as number) > 0) {
      parentComment = await this.feedCommentModel.findByPk(originCmt as number);
      if (!parentComment || parentComment.highlight_id !== feedId) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.origin_cmt !== null) {
        throw new BadRequestException('Only 2 comment levels are supported');
      }
      normalizedOriginCmt = parentComment.id;
    }

    const comment = await this.feedCommentModel.create({
      user_id: userId,
      highlight_id: feedId,
      content: trimmedContent,
      origin_cmt: normalizedOriginCmt,
    });

    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName'],
    });

    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

    if (parentComment && parentComment.user_id !== userId) {
      await this.notificationService.createAndEmit({
        userId: parentComment.user_id,
        eventType: NotificationEventType.FEED_COMMENT_REPLY,
        sseEventType: NotificationSseEventType.NOTIFY_CREATED,
        title: 'New reply to your comment',
        message: fullName
          ? `${fullName} replied to your comment`
          : 'Someone replied to your comment',
        sourceType: NotificationSourceType.FEED_COMMENT,
        sourceId: comment.id,
        payload: {
          feedId,
          commentId: comment.id,
          parentCommentId: parentComment.id,
          actorUserId: userId,
          content: trimmedContent,
          redirectUrl: this.buildFeedRedirectUrl(feedId),
        },
      });
    } else if (!parentComment) {
      const feed = await this.highlightFeedModel.findByPk(feedId, {
        include: [{ model: Course, attributes: ['id', 'userId'] }],
      });
      const feedOwnerId = feed?.course?.userId;
      if (feedOwnerId != null && feedOwnerId !== userId) {
        await this.notificationService.createAndEmit({
          userId: feedOwnerId,
          eventType: NotificationEventType.FEED_COMMENT_CREATED,
          sseEventType: NotificationSseEventType.NOTIFY_CREATED,
          title: 'New comment on your feed',
          message: fullName
            ? `${fullName} commented on your post`
            : 'Someone commented on your post',
          sourceType: NotificationSourceType.FEED_COMMENT,
          sourceId: comment.id,
          payload: {
            feedId,
            commentId: comment.id,
            actorUserId: userId,
            content: trimmedContent,
            redirectUrl: this.buildFeedRedirectUrl(feedId),
          },
        });
      }
    }

    const commentCount = await this.feedCommentModel.count({
      where: { highlight_id: feedId },
    });

    comment.user = user as User;
    return {
      ...this.mapCommentResponse(comment, userId, 0),
      comment_count: commentCount,
    };
  }

  async getComments(feedId: number, cursor?: number, limit = 20, userId?: number) {
    await this.validateFeedCommentTarget(feedId);

    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 20;

    const comments = await this.feedCommentModel.findAll({
      where: {
        highlight_id: feedId,
        origin_cmt: null,
        ...(cursor && { id: { [Op.lt]: cursor } }),
      },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['id', 'DESC']],
      limit: safeLimit,
    });

    const parentIds = comments.map((comment) => comment.id);
    const nestedCountRows =
      parentIds.length > 0
        ? ((await this.feedCommentModel.findAll({
          where: {
            highlight_id: feedId,
            origin_cmt: { [Op.in]: parentIds },
          },
          attributes: ['origin_cmt', [fn('COUNT', col('id')), 'total_nested_cmt']],
          group: ['origin_cmt'],
          raw: true,
        })) as unknown as Array<{ origin_cmt: number; total_nested_cmt: string | number }>)
        : [];

    const nestedCountMap = new Map<number, number>(
      nestedCountRows.map((row) => [Number(row.origin_cmt), Number(row.total_nested_cmt || 0)]),
    );

    const data = comments.map((comment) =>
      this.mapCommentResponse(comment, userId, nestedCountMap.get(comment.id) ?? 0),
    );

    return {
      data,
      next_cursor: data.length === safeLimit ? data[data.length - 1].id : null,
    };
  }

  async getCommentDetail(
    feedId: number,
    originCmt: number,
    cursor?: number,
    limit = 20,
    userId?: number,
  ) {
    await this.validateFeedCommentTarget(feedId);

    const parentComment = await this.feedCommentModel.findByPk(originCmt);
    if (!parentComment || parentComment.highlight_id !== feedId || parentComment.origin_cmt !== null) {
      throw new NotFoundException('Origin comment not found');
    }

    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 20;
    const comments = await this.feedCommentModel.findAll({
      where: {
        highlight_id: feedId,
        origin_cmt: originCmt,
        ...(cursor && { id: { [Op.lt]: cursor } }),
      },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['id', 'DESC']],
      limit: safeLimit,
    });

    const data = comments.map((comment) => this.mapCommentResponse(comment, userId));

    return {
      origin_cmt: originCmt,
      data,
      next_cursor: data.length === safeLimit ? data[data.length - 1].id : null,
    };
  }

  async updateComment(userId: number, feedId: number, commentId: number, content: string) {
    await this.validateFeedCommentTarget(feedId);

    const comment = await this.feedCommentModel.findByPk(commentId);
    if (!comment || comment.highlight_id !== feedId) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    const trimmedContent = content?.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Comment content cannot be empty');
    }
    if (trimmedContent.length > 1000) {
      throw new BadRequestException('Comment content must be 1000 characters or less');
    }

    comment.content = trimmedContent;
    await comment.save();

    return {
      id: comment.id,
      content: comment.content,
      origin_cmt: comment.origin_cmt ?? null,
      created_at: comment.get('created_at'),
      updated_at: comment.get('updated_at'),
      is_owner: true,
    };
  }

  async deleteComment(userId: number, feedId: number, commentId: number) {
    await this.validateFeedCommentTarget(feedId);

    const comment = await this.feedCommentModel.findByPk(commentId);
    if (!comment || comment.highlight_id !== feedId) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await comment.destroy();
    return { deleted: true };
  }
}
