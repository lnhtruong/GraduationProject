import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { HighlightFeed, HighlightFeedStatus } from '../models/highlight_feed.model';
import { FeedInteraction, FeedInteractionType } from '../models/feed_interactions.model';
import { FeedView } from '../models/feed_views.model';
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
    @InjectModel(Video)
    private videoModel: typeof Video,
    @InjectModel(Course)
    private courseModel: typeof Course,
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

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
      status: HighlightFeedStatus.ACTIVE,
    });

    return feedItem;
  }

  async getFeed(cursor?: number, limit = 10, userId?: number) {
    const where: any = { status: HighlightFeedStatus.ACTIVE };
    if (cursor) {
      where.id = { [Op.lt]: cursor };
    }

    const feeds = await this.highlightFeedModel.findAll({
      where,
      include: [
        {
          model: Video,
          attributes: ['url', 'thumbnail', 'duration', 'type'],
        },
        {
          model: Course,
          attributes: ['id', 'name', 'price'],
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
      limit,
    });

    const data = await Promise.all(
      feeds.map(async (feed) => {
        const stats = await this.getFeedStats(feed.id);
        let isLiked = false;
        let isSaved = false;
        if (userId) {
          isLiked = !!(await this.feedInteractionModel.findOne({
            where: { user_id: userId, highlight_id: feed.id, type: FeedInteractionType.LIKE },
          }));
          isSaved = !!(await this.feedInteractionModel.findOne({
            where: { user_id: userId, highlight_id: feed.id, type: FeedInteractionType.SAVE },
          }));
        }
        return {
          feed_id: feed.id,
          title: feed.title,
          hashtags: feed.hashtags,
          video_type: feed.video!.type,
          video: {
            url: feed.video!.url,
            thumbnail: feed.video!.thumbnail,
            duration: feed.video!.duration,
          },
          course: {
            id: feed.course!.id,
            name: feed.course!.name,
            price: feed.course!.price,
          },
          lecturer: {
            id: feed.course!.user!.id,
            firstName: feed.course!.user!.firstName,
            lastName: feed.course!.user!.lastName,
          },
          stats,
          is_liked: isLiked,
          is_saved: isSaved,
        };
      }),
    );

    const nextCursor = data.length === limit ? data[data.length - 1].feed_id : null;

    return { data, next_cursor: nextCursor };
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
}