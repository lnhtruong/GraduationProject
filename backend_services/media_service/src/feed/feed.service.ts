import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { HighlightFeed, HighlightFeedStatus } from '../models/highlight_feed.model';
import { CourseStatus } from '../models/course.model';
import { FeedInteraction, FeedInteractionType } from '../models/feed_interactions.model';
import { FeedView } from '../models/feed_views.model';
import { FeedComment } from '../models/feed_comments.model';
import { Video } from '../videos/video.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';

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
  ) { }

  async addToFeed(userId: number, videoId: number, courseId: number, title?: string, hashtags?: string[]) {
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
      hashtags,
      status: HighlightFeedStatus.HIDDEN,
    });

    return feedItem;
  }

  async getFeed(cursor?: number, limit = 10, userId?: number, courseId?: number, mode?: string) {
    if (mode === 'recommended') {
      return this.getRecommendedFeed(cursor, limit, userId, courseId);
    }

    // Query feeds với cursor-based pagination, eager load video + course + lecturer
    const feeds = await this.highlightFeedModel.findAll({
      where: {
        status: HighlightFeedStatus.ACTIVE,
        ...(cursor && { id: { [Op.lt]: cursor } }), // chỉ lấy items có id nhỏ hơn cursor
        ...(courseId && { course_id: courseId }), // filter by course_id nếu có
      },
      include: [
        { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
        {
          model: Course,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }], // lecturer info
        },
      ],
      order: [['id', 'DESC']], // mới nhất trước
      limit,
    });

    const data = await Promise.all(
      feeds.map(async (feed) => {
        // Fetch stats + interaction status của user song song để tối ưu performance
        const [stats, liked, saved] = await Promise.all([
          this.getFeedStats(feed.id),
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

    const userViews = await this.feedViewModel.findAll({
      where: { user_id: userId },
      include: [{ model: HighlightFeed, attributes: ['id', 'course_id', 'hashtags'] }],
      order: [['id', 'DESC']],
      limit: 200,
    });

    const courseAffinity = new Map<number, number>();
    const hashtagAffinity = new Map<string, number>();
    const viewedCount = new Map<number, number>();

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

    const candidateFeeds = await this.highlightFeedModel.findAll({
      where: {
        status: HighlightFeedStatus.ACTIVE,
        ...(cursor && { id: { [Op.lt]: cursor } }),
        ...(courseId && { course_id: courseId }),
      },
      include: [
        { model: Video, attributes: ['url', 'thumbnail', 'duration', 'type'] },
        {
          model: Course,
          where: { status: CourseStatus.PUBLISH },
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [['id', 'DESC']],
      limit: safeLimit,
    });

    if (!candidateFeeds.length) {
      return { data: [], next_cursor: null };
    }

    const feedIds = candidateFeeds.map((feed) => feed.id);

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

    const statsByFeed = new Map<number, { likes: number; saves: number; views: number }>();
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

    const likedSet = new Set<number>();
    const savedSet = new Set<number>();
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

    const ranked = candidateFeeds
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
      });

    const data = ranked.map(({ feed, stats }) => {
      const { user, ...courseData } = feed.course!.toJSON();
      return {
        feed_id: feed.id,
        title: feed.title,
        hashtags: feed.hashtags,
        video_type: feed.video!.type,
        video: feed.video!.toJSON(),
        course: courseData,
        lecturer: user,
        stats,
        is_liked: likedSet.has(feed.id),
        is_saved: savedSet.has(feed.id),
      };
    });

    const minFeedId = data.reduce((minId, item) => Math.min(minId, item.feed_id), data[0].feed_id);
    return {
      data,
      next_cursor: data.length === safeLimit ? minFeedId : null,
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

  private async getFeedStats(feedId: number) {
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
      return { type, active: true };
    } else {
      // Toggle for like/save
      const existing = await this.feedInteractionModel.findOne({
        where: { user_id: userId, highlight_id: feedId, type },
      });
      if (existing) {
        await existing.destroy();
        return { type, active: false };
      } else {
        await this.feedInteractionModel.create({
          user_id: userId,
          highlight_id: feedId,
          type,
        });
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

    return { recorded: true };
  }

  async updateFeed(userId: number, feedId: number, title?: string, hashtags?: string[], status?: string) {
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