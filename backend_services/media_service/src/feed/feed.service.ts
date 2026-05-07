import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

type FeedResponseItem = {
  feed_id: number;
  title?: string;
  caption?: string | null;
  hashtags?: string[];
  video_type: string;
  video: unknown;
  course: unknown;
  lecturer: unknown;
  stats: { likes: number; saves: number; views: number };
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
  ) {}

  private readonly ADMIN_ROLE = 1;
  private readonly LECTURER_ROLE = 3;
  private readonly RECOMMEND_CACHE_TTL_SECONDS = 600;
  private readonly PROFILE_TTL_SECONDS = 24 * 60 * 60;
  private readonly SEEN_COOLDOWN_SECONDS = 6 * 60 * 60;
  private readonly RECOMMEND_CACHE_SIZE = 100;
  private readonly ACTIVE_USER_LOOKBACK_MS = 24 * 60 * 60 * 1000;

  private parseNumberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
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

  private buildRecommendListKey(userId: number, courseId?: number): string {
    return `feed:rec:list:${userId}:${courseId ?? 0}`;
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

  private async getCachedRecommendList(userId: number, courseId?: number): Promise<number[] | null> {
    const raw = await this.redisService.get(this.buildRecommendListKey(userId, courseId));
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
    courseId: number | undefined,
    feedIds: number[],
  ): Promise<void> {
    await this.redisService.set(
      this.buildRecommendListKey(userId, courseId),
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
    statsByFeed: Map<number, { likes: number; saves: number; views: number }>;
    likedSet: Set<number>;
    savedSet: Set<number>;
  }> {
    const statsByFeed = new Map<number, { likes: number; saves: number; views: number }>();
    const likedSet = new Set<number>();
    const savedSet = new Set<number>();

    if (feedIds.length === 0) {
      return { statsByFeed, likedSet, savedSet };
    }

    const [interactionRows, viewRows, userInteractionRows] = await Promise.all([
      this.feedInteractionModel.findAll({
        where: { highlight_id: { [Op.in]: feedIds } },
        attributes: [
          'highlight_id',
          [fn('SUM', literal("CASE WHEN type = 'like' THEN 1 ELSE 0 END")), 'likes'],
          [fn('SUM', literal("CASE WHEN type = 'save' THEN 1 ELSE 0 END")), 'saves'],
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
    }>;
    for (const row of interactionAggRows) {
      const feedId = Number(row.highlight_id);
      statsByFeed.set(feedId, {
        likes: Number(row.likes || 0),
        saves: Number(row.saves || 0),
        views: statsByFeed.get(feedId)?.views || 0,
      });
    }

    const viewAggRows = viewRows as unknown as Array<{ highlight_id: number; views: string | number }>;
    for (const row of viewAggRows) {
      const feedId = Number(row.highlight_id);
      const current = statsByFeed.get(feedId) || { likes: 0, saves: 0, views: 0 };
      current.views = Number(row.views || 0);
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

  private async buildFeedResponse(
    feedIds: number[],
    statsByFeed: Map<number, { likes: number; saves: number; views: number }>,
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
      const stats = statsByFeed.get(feed.id) || { likes: 0, saves: 0, views: 0 };
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
      throw new BadRequestException('Video already in feed');
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

  async getFeed(cursor?: number, limit = 10, userId?: number, courseId?: number, mode?: string, search?: string) {
    if (mode === 'recommended') {
      return this.getRecommendedFeed(cursor, limit, userId, courseId);
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
      ...(term ? { subQuery: false } : {}),
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

  private async getRecommendedFeed(cursor?: number, limit = 10, userId?: number, courseId?: number) {
    if (!userId) {
      throw new BadRequestException('User not authenticated for recommendation mode');
    }

    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 20) : 10;

    const cachedList = await this.getCachedRecommendList(userId, courseId);
    if (cachedList) {
      const pageIds = this.pageFeedIds(cachedList, cursor, safeLimit);
      if (pageIds.length > 0) {
        const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(
          pageIds,
          userId,
        );
        const data = await this.buildFeedResponse(pageIds, statsByFeed, likedSet, savedSet);
        return {
          data,
          next_cursor: data.length === safeLimit ? data[data.length - 1].feed_id : null,
        };
      }
    }

    const { rankedFeeds, statsByFeed, likedSet, savedSet } = await this.computeRankedCandidates(
      userId,
      courseId,
    );
    if (!rankedFeeds.length) {
      return { data: [], next_cursor: null };
    }

    const rankedIds = rankedFeeds.map((item) => item.feed.id);
    await this.setCachedRecommendList(userId, courseId, rankedIds);

    const pageIds = this.pageFeedIds(rankedIds, cursor, safeLimit);
    const data = await this.buildFeedResponse(pageIds, statsByFeed, likedSet, savedSet);
    return {
      data,
      next_cursor: data.length === safeLimit ? data[data.length - 1].feed_id : null,
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

  private async invalidateRecommendCache(userId: number, courseId?: number): Promise<void> {
    await this.redisService.del(this.buildRecommendListKey(userId, courseId));
    if (courseId) {
      await this.redisService.del(this.buildRecommendListKey(userId, undefined));
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

  async precomputeRecommendedForActiveUsers(): Promise<void> {
    const members = await this.redisService.sMembers(this.buildInteractedUsersKey());
    const userIds = members
      .map((value) => Number(value))
      .filter((id) => Number.isFinite(id));

    for (const userId of userIds) {
      const { rankedFeeds } = await this.computeRankedCandidates(userId);
      const rankedIds = rankedFeeds.map((item) => item.feed.id);
      await this.setCachedRecommendList(userId, undefined, rankedIds);
    }

    await this.redisService.sRem(this.buildInteractedUsersKey(), members);
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

  private async computeRankedCandidates(
    userId: number,
    courseId?: number,
  ): Promise<{
    rankedFeeds: Array<{ feed: HighlightFeed; stats: { likes: number; saves: number; views: number } }>;
    statsByFeed: Map<number, { likes: number; saves: number; views: number }>;
    likedSet: Set<number>;
    savedSet: Set<number>;
    viewedCount: Map<number, number>;
    courseAffinity: Map<number, number>;
    hashtagAffinity: Map<string, number>;
  }> {
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
      for (const view of userViews) {
        const highlight = view.highlight;
        if (!highlight) {
          continue;
        }

        const behaviorWeight = (view.completed ? 2 : 1) + Math.min((view.watch_duration || 0) / 30, 2);
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

    const seenIds = await this.getRecentSeenFeedIds(userId, 1000);
    const baseWhere = {
      status: HighlightFeedStatus.ACTIVE,
      ...(courseId && { course_id: courseId }),
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

    const feedIds = candidateFeeds.map((feed) => feed.id);
    const { statsByFeed, likedSet, savedSet } = await this.getStatsAndInteractions(feedIds, userId);

    const rankedFeeds = candidateFeeds
      .map((feed) => {
        const stats = statsByFeed.get(feed.id) || { likes: 0, saves: 0, views: 0 };
        const courseScore = courseAffinity.get(feed.course_id) || 0;
        const tags = this.normalizeHashtags(feed.hashtags);
        const tagScore = tags.reduce((sum, tag) => sum + (hashtagAffinity.get(tag) || 0), 0);
        const repeatedViewPenalty = Math.min((viewedCount.get(feed.id) || 0) * 0.6, 2);

        const globalScore = stats.likes * 3 + stats.saves * 4 + stats.views * 0.5;
        const personalScore = courseScore * 2 + tagScore * 1.2;
        const recommendationScore = globalScore + personalScore - repeatedViewPenalty;

        return { feed, stats, recommendationScore };
      })
      .sort((a, b) => {
        if (b.recommendationScore !== a.recommendationScore) {
          return b.recommendationScore - a.recommendationScore;
        }
        return b.feed.id - a.feed.id;
      })
      .map(({ feed, stats }) => ({ feed, stats }));

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
    if (Number.isInteger(originCmt) && (originCmt as number) > 0) {
      const parentComment = await this.feedCommentModel.findByPk(originCmt as number);
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

    comment.user = user as User;
    return this.mapCommentResponse(comment, userId, 0);
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