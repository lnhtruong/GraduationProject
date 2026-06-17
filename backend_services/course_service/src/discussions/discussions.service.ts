import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal, Transaction, UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import { DiscussionPost } from '../models/discussion-post.model';
import { DiscussionUpvote } from '../models/discussion-upvote.model';
import { Lesson } from '../models/lesson.model';
import { Course } from '../models/course.model';
import { Enroll } from '../models/enroll.model';
import { User } from '../users/user.model';
import {
  DISCUSSION_REPLY_EVENT,
  DISCUSSION_POST_SOURCE,
} from '../models/notification.model';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';

const LECTURER_ROLE = 3;
const ADMIN_ROLE = 1;
const NOTIFY_CREATED_SSE_EVENT = 'notify:created';

export type DiscussionSort = 'newest' | 'upvotes';
export type DiscussionStatus = 'answered' | 'unanswered';

export interface AuthorSnapshot {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface PostSnapshot {
  id: number;
  lessonId: number;
  parentId: number | null;
  content: string;
  isBestAnswer: boolean;
  upvotes: number;
  voted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorSnapshot;
}

export interface DiscussionRoot extends PostSnapshot {
  replies: PostSnapshot[];
}

@Injectable()
export class DiscussionsService {
  constructor(
    @InjectModel(DiscussionPost)
    private readonly postModel: typeof DiscussionPost,
    @InjectModel(Lesson) private readonly lessonModel: typeof Lesson,
    @InjectModel(Course) private readonly courseModel: typeof Course,
    @InjectModel(Enroll) private readonly enrollModel: typeof Enroll,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(DiscussionUpvote)
    private readonly upvoteModel: typeof DiscussionUpvote,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) { }

  // ─────────────────────── BE-03: upvote toggle ───────────────────────

  async toggleUpvote(
    postId: number,
    userId: number,
  ): Promise<{ upvotes: number; voted: boolean }> {
    return this.sequelize.transaction(async (t: Transaction) => {
      const post = await this.postModel.findByPk(postId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!post) {
        throw new NotFoundException(`Post ${postId} not found`);
      }

      const existing = await this.upvoteModel.findOne({
        where: { postId, userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existing) {
        await existing.destroy({ transaction: t });
        post.upvotes = Math.max(0, post.upvotes - 1);
        await post.save({ transaction: t });
        return { upvotes: post.upvotes, voted: false };
      }

      try {
        await this.upvoteModel.create(
          { postId, userId },
          { transaction: t },
        );
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          return { upvotes: post.upvotes, voted: true };
        }
        throw err;
      }
      post.upvotes = post.upvotes + 1;
      await post.save({ transaction: t });
      return { upvotes: post.upvotes, voted: true };
    });
  }

  // ─────────────────────── BE-03: best answer ───────────────────────

  async toggleBestAnswer(
    postId: number,
    userId: number,
    role: number,
  ): Promise<PostSnapshot> {
    const post = await this.postModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }
    if (post.parentId === null) {
      throw new BadRequestException(
        'A root question cannot be marked as best answer — mark one of its replies instead',
      );
    }

    if (role !== ADMIN_ROLE) {
      const lesson = await this.lessonModel.findByPk(post.lessonId);
      const course = lesson
        ? await this.courseModel.findByPk((lesson as any).courseId, {
          attributes: ['id', 'userId'],
        })
        : null;
      if (!course || course.userId !== userId || role !== LECTURER_ROLE) {
        throw new ForbiddenException(
          'Only the course instructor may mark a best answer',
        );
      }
    }

    await this.sequelize.transaction(async (t: Transaction) => {
      if (post.isBestAnswer) {
        post.isBestAnswer = false;
        await post.save({ transaction: t });
        return;
      }
      await this.postModel.update(
        { isBestAnswer: false },
        {
          where: {
            parentId: post.parentId,
            isBestAnswer: true,
            id: { [Op.ne]: post.id },
          },
          transaction: t,
        },
      );
      post.isBestAnswer = true;
      await post.save({ transaction: t });
    });

    const refreshed = await this.postModel.findByPk(postId, {
      include: [
        {
          model: this.userModel,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
    });
    return this.serialise(refreshed!);
  }

  /**
   * BE-04: notify the root-post author when someone replies to their question.
   * Best-effort: any failure is logged but does not break the create flow.
   */
  private async notifyRootAuthorOfReply(reply: DiscussionPost): Promise<void> {
    try {
      if (reply.parentId === null) return;

      const parent = await this.postModel.findByPk(reply.parentId, {
        attributes: ['id', 'userId', 'parentId'],
      });
      if (!parent) return;
      const rootId = parent.parentId ?? parent.id;
      const root = parent.parentId
        ? await this.postModel.findByPk(rootId, {
          attributes: ['id', 'userId'],
        })
        : parent;
      if (!root || root.userId === reply.userId) return;

      const [replyAuthor, lesson] = await Promise.all([
        this.userModel.findByPk(reply.userId, {
          attributes: ['id', 'firstName', 'lastName', 'email'],
        }),
        this.lessonModel.findByPk(reply.lessonId, {
          attributes: ['id', 'title', 'courseId'],
        }),
      ]);
      const replyName =
        [
          (replyAuthor as any)?.firstName,
          (replyAuthor as any)?.lastName,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        (replyAuthor as any)?.email ||
        'Someone';
      const lessonTitle = (lesson as any)?.title ?? 'this lesson';
      const courseId = (lesson as any)?.courseId;
      const redirectUrl = courseId
        ? `/courses/${courseId}/lessons/${reply.lessonId}#discussion-${root.id}`
        : `/lessons/${reply.lessonId}#discussion-${root.id}`;

      const mediaServiceUrl =
        process.env.MEDIA_SERVICE_URL || 'http://localhost:8003';
      const body = {
        userId: root.userId,
        eventType: DISCUSSION_REPLY_EVENT,
        sseEventType: NOTIFY_CREATED_SSE_EVENT,
        title: 'You have a new reply for your discussion!',
        message: `${replyName} has answered your question in the post ${lessonTitle}`,
        payload: {
          replyId: reply.id,
          rootPostId: root.id,
          lessonId: reply.lessonId,
          courseId: courseId ?? null,
          redirectUrl,
          replyAuthorId: reply.userId,
        },
        sourceType: DISCUSSION_POST_SOURCE,
        sourceId: reply.id,
      };
      const secret = process.env.INTERNAL_SERVICE_SECRET;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (secret) headers['x-internal-secret'] = secret;

      const res = await fetch(`${mediaServiceUrl}/notifications/internal`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(
          `[discussions] reply notification dispatch failed (${res.status}): ${text}`,
        );
      }
    } catch (err) {

      console.warn('[discussions] failed to dispatch reply notification', err);
    }
  }

  private serialiseAuthor(user?: User | null): AuthorSnapshot {
    if (!user) {
      return { id: 0, name: 'Unknown', avatarUrl: null };
    }
    const first = (user as any).firstName ?? '';
    const last = (user as any).lastName ?? '';
    const name = `${first} ${last}`.trim() || (user as any).email || 'User';
    return {
      id: (user as any).id,
      name,
      avatarUrl: (user as any).avatarUrl ?? null,
    };
  }

  private serialise(post: DiscussionPost, userUpvotes?: Set<number>): PostSnapshot {
    return {
      id: post.id,
      lessonId: post.lessonId,
      parentId: post.parentId,
      content: post.content,
      isBestAnswer: post.isBestAnswer,
      upvotes: post.upvotes,
      voted: userUpvotes ? userUpvotes.has(post.id) : false,
      createdAt: (post as any).created_at ?? (post as any).createdAt,
      updatedAt: (post as any).updated_at ?? (post as any).updatedAt,
      author: this.serialiseAuthor(post.author ?? undefined),
    };
  }

  private async getLessonOrFail(lessonId: number): Promise<Lesson> {
    const lesson = await this.lessonModel.findByPk(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }
    return lesson;
  }

  private async getCourseOrFail(courseId: number): Promise<Course> {
    const course = await this.courseModel.findByPk(courseId);
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }
    return course;
  }

  private async assertCanReadLesson(
    lesson: Lesson,
    userId: number,
    role: number,
  ): Promise<void> {
    if (role === ADMIN_ROLE) return;

    const course = await this.courseModel.findByPk((lesson as any).courseId, {
      attributes: ['id', 'userId'],
    });
    if (!course) {
      throw new ForbiddenException('Lesson is not attached to a course');
    }
    if (course.userId === userId) return;

    const enrolment = await this.enrollModel.findOne({
      where: { userId, courseId: course.id },
    });
    if (!enrolment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to view the discussion',
      );
    }
  }

  private async assertInstructorOfCourse(
    courseId: number,
    userId: number,
    role: number,
  ): Promise<Course> {
    const course = await this.getCourseOrFail(courseId);
    if (role === ADMIN_ROLE) return course;
    if (course.userId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor may access this resource',
      );
    }
    return course;
  }

  async listByLesson(
    lessonId: number,
    userId: number,
    role: number,
    options: { page?: number; limit?: number; sort?: DiscussionSort } = {},
  ): Promise<{
    data: DiscussionRoot[];
    total: number;
    page: number;
    limit: number;
  }> {
    const lesson = await this.getLessonOrFail(lessonId);
    await this.assertCanReadLesson(lesson, userId, role);

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const offset = (page - 1) * limit;

    const sort: DiscussionSort =
      options.sort === 'upvotes' ? 'upvotes' : 'newest';
    const order: any =
      sort === 'upvotes'
        ? [
          ['upvotes', 'DESC'],
          ['created_at', 'DESC'],
        ]
        : [['created_at', 'DESC']];

    const { rows, count } = await this.postModel.findAndCountAll({
      where: { lessonId, parentId: null },
      include: [
        {
          model: this.userModel,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
      order,
      limit,
      offset,
    });

    const rootIds = rows.map((r) => r.id);
    let replies: DiscussionPost[] = [];
    if (rootIds.length) {
      replies = await this.postModel.findAll({
        where: { parentId: { [Op.in]: rootIds } },
        include: [
          {
            model: this.userModel,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          },
        ],
        order: [['created_at', 'ASC']],
      });
    }

    // Tải các bài viết đã upvote bởi user này
    const allPostIds = [...rootIds, ...replies.map((r) => r.id)];
    let userUpvotes = new Set<number>();
    if (allPostIds.length && userId) {
      const upvotes = await this.upvoteModel.findAll({
        where: {
          postId: { [Op.in]: allPostIds },
          userId,
        },
        attributes: ['postId'],
      });
      userUpvotes = new Set(upvotes.map((u) => u.postId));
    }

    const repliesByParent = new Map<number, DiscussionPost[]>();
    for (const r of replies) {
      const list = repliesByParent.get(r.parentId!) ?? [];
      list.push(r);
      repliesByParent.set(r.parentId!, list);
    }

    const data: DiscussionRoot[] = rows.map((root) => ({
      ...this.serialise(root, userUpvotes),
      replies: (repliesByParent.get(root.id) ?? []).map((r) =>
        this.serialise(r, userUpvotes),
      ),
    }));

    return { data, total: count, page, limit };
  }

  async createForLesson(
    lessonId: number,
    userId: number,
    role: number,
    dto: CreateDiscussionDto,
  ): Promise<PostSnapshot & { parentRootId: number | null }> {
    const lesson = await this.getLessonOrFail(lessonId);
    await this.assertCanReadLesson(lesson, userId, role);

    let parentId: number | null = null;
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await this.postModel.findByPk(dto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent post ${dto.parentId} not found`);
      }
      if (parent.lessonId !== lessonId) {
        throw new BadRequestException(
          'Parent post belongs to a different lesson',
        );
      }
      // 2-level nesting: replies to a reply are re-anchored to the root.
      parentId = parent.parentId ?? parent.id;
    }

    const created = await this.postModel.create({
      lessonId,
      userId,
      parentId,
      content: dto.content,
    });

    // BE-04 hook: notify the root-post author if this is a reply by a
    // different user. Failure must not break the post creation.
    if (parentId !== null) {
      await this.notifyRootAuthorOfReply(created);
    }

    const withAuthor = await this.postModel.findByPk(created.id, {
      include: [
        {
          model: this.userModel,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
    });
    return { ...this.serialise(withAuthor!), parentRootId: parentId };
  }

  async update(
    postId: number,
    userId: number,
    dto: UpdateDiscussionDto,
  ): Promise<PostSnapshot> {
    const post = await this.postModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('Only the author may edit this post');
    }
    post.content = dto.content;
    await post.save();

    const refreshed = await this.postModel.findByPk(postId, {
      include: [
        {
          model: this.userModel,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
    });
    return this.serialise(refreshed!);
  }

  async remove(postId: number, userId: number, role: number): Promise<void> {
    const post = await this.postModel.findByPk(postId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    if (post.userId !== userId && role !== ADMIN_ROLE) {
      const lesson = await this.lessonModel.findByPk(post.lessonId);
      const course = lesson
        ? await this.courseModel.findByPk((lesson as any).courseId, {
          attributes: ['id', 'userId'],
        })
        : null;
      if (!course || course.userId !== userId || role !== LECTURER_ROLE) {
        throw new ForbiddenException(
          'Only the author, course instructor, or admin may delete this post',
        );
      }
    }

    await post.destroy();
  }

  async listByCourse(
    courseId: number,
    userId: number,
    role: number,
    options: {
      page?: number;
      limit?: number;
      lessonId?: number;
      status?: DiscussionStatus;
    } = {},
  ): Promise<{
    data: (PostSnapshot & { lessonTitle: string; replyCount: number })[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.assertInstructorOfCourse(courseId, userId, role);

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const offset = (page - 1) * limit;

    const lessons = await this.lessonModel.findAll({
      where: { courseId },
      attributes: ['id', 'title'],
    });
    const lessonTitleById = new Map<number, string>(
      lessons.map((l) => [l.id, (l as any).title]),
    );
    let lessonIds = lessons.map((l) => l.id);
    if (options.lessonId !== undefined) {
      lessonIds = lessonIds.filter((id) => id === options.lessonId);
    }
    if (lessonIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    const where: any = { lessonId: { [Op.in]: lessonIds }, parentId: null };
    if (options.status === 'answered') {
      where[Op.and] = literal(
        '(SELECT COUNT(*) FROM discussion_posts r WHERE r.parent_id = `DiscussionPost`.`id`) > 0',
      );
    } else if (options.status === 'unanswered') {
      where[Op.and] = literal(
        '(SELECT COUNT(*) FROM discussion_posts r WHERE r.parent_id = `DiscussionPost`.`id`) = 0',
      );
    }

    const { rows, count } = await this.postModel.findAndCountAll({
      where,
      include: [
        {
          model: this.userModel,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    const rootIds = rows.map((r) => r.id);
    const replyCountById = new Map<number, number>();
    if (rootIds.length) {
      const counts = (await this.postModel.findAll({
        where: { parentId: { [Op.in]: rootIds } },
        attributes: ['parentId', [literal('COUNT(*)'), 'cnt']],
        group: ['parentId'],
        raw: true,
      })) as unknown as { parentId: number; cnt: string | number }[];
      for (const c of counts) {
        replyCountById.set(Number(c.parentId), Number(c.cnt));
      }
    }

    const data = rows.map((row) => ({
      ...this.serialise(row),
      lessonTitle: lessonTitleById.get(row.lessonId) ?? '',
      replyCount: replyCountById.get(row.id) ?? 0,
    }));

    return { data, total: count, page, limit };
  }
}
