/* eslint-disable @typescript-eslint/no-explicit-any */
import { getModelToken } from '@nestjs/sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { Op } from 'sequelize';

import { HighlightFeed } from '../models/highlight_feed.model';
import { FeedInteraction } from '../models/feed_interactions.model';
import { FeedView } from '../models/feed_views.model';
import { FeedComment } from '../models/feed_comments.model';
import { Video } from '../videos/video.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notifications/notification.service';

import { FeedService } from './feed.service';

type Mock = jest.Mock;

const captureSql = () => {
  // Sequelize literal() stores raw SQL in `.val`; the type doesn't expose it
  // publicly so we cast through `unknown`.
  return (literal: unknown): string => (literal as { val: string }).val;
};

const sequelizeStub = {
  // Match how mysql2 driver would escape — single-quote wrap.
  escape: (value: unknown) => `'${String(value)}'`,
};

const makeFeedModel = () => {
  const findAll: Mock = jest.fn();
  return {
    findAll,
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    sequelize: sequelizeStub,
  };
};

const passThroughModel = () => ({
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
});

describe('FeedService — hashtag filter & trending hashtags', () => {
  let service: FeedService;
  let highlightFeedModel: ReturnType<typeof makeFeedModel>;

  beforeEach(async () => {
    highlightFeedModel = makeFeedModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getModelToken(HighlightFeed), useValue: highlightFeedModel },
        { provide: getModelToken(FeedInteraction), useValue: passThroughModel() },
        { provide: getModelToken(FeedView), useValue: passThroughModel() },
        { provide: getModelToken(FeedComment), useValue: passThroughModel() },
        { provide: getModelToken(Video), useValue: passThroughModel() },
        { provide: getModelToken(Course), useValue: passThroughModel() },
        { provide: getModelToken(User), useValue: passThroughModel() },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            del: jest.fn(),
            delMany: jest.fn(),
            scanKeys: jest.fn().mockResolvedValue([]),
            sMembers: jest.fn().mockResolvedValue([]),
            sRem: jest.fn(),
            sAdd: jest.fn(),
            acquireLock: jest.fn().mockResolvedValue(false),
            releaseLock: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn(),
            push: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  describe('getFeed(...) — hashtag filter (search mode)', () => {
    it('không truyền hashtag → where clause không có JSON_CONTAINS', async () => {
      highlightFeedModel.findAll.mockResolvedValueOnce([]);
      await service.getFeed(undefined, 10, undefined, undefined, 'search');

      const call = highlightFeedModel.findAll.mock.calls[0][0];
      const andList = call.where[Op.and] ?? [];
      const hasJsonContains = andList.some((c: any) =>
        captureSql()(c)?.includes('JSON_CONTAINS('),
      );
      expect(hasJsonContains).toBe(false);
    });

    it('hashtag="javascript" → đẩy JSON_CONTAINS(... JSON_QUOTE(\'javascript\')) vào where', async () => {
      highlightFeedModel.findAll.mockResolvedValueOnce([]);
      await service.getFeed(
        undefined,
        10,
        undefined,
        undefined,
        'search',
        undefined,
        undefined,
        'javascript',
      );

      const call = highlightFeedModel.findAll.mock.calls[0][0];
      expect(call.subQuery).toBe(false);

      const andList = call.where[Op.and];
      expect(Array.isArray(andList)).toBe(true);
      const lit = andList[0];
      const sql = captureSql()(lit);

      expect(sql).toContain('JSON_CONTAINS(HighlightFeed.hashtags');
      expect(sql).toContain("JSON_QUOTE('javascript')");
      // Variant có dấu # cũng phải có để match dữ liệu cũ.
      expect(sql).toContain("JSON_QUOTE('#javascript')");
    });

    it('hashtag="#UIUX" → giữ cả case gốc lẫn lowercase (JSON_CONTAINS case-sensitive) + fallback JSON_SEARCH', async () => {
      highlightFeedModel.findAll.mockResolvedValueOnce([]);
      await service.getFeed(
        undefined,
        10,
        undefined,
        undefined,
        'search',
        undefined,
        undefined,
        '#UIUX',
      );

      const call = highlightFeedModel.findAll.mock.calls[0][0];
      const sql = captureSql()(call.where[Op.and][0]);
      // Nhánh nhanh: 4 biến thể exact JSON_CONTAINS
      expect(sql).toContain("JSON_QUOTE('UIUX')");
      expect(sql).toContain("JSON_QUOTE('#UIUX')");
      expect(sql).toContain("JSON_QUOTE('uiux')");
      expect(sql).toContain("JSON_QUOTE('#uiux')");
      // Nhánh fallback: JSON_SEARCH case-insensitive
      expect(sql).toContain('JSON_SEARCH(LOWER(CAST(HighlightFeed.hashtags AS CHAR))');
      expect(sql).toContain("'uiux'");
      expect(sql).toContain("'#uiux'");
    });

    it('hashtag rỗng / chỉ có dấu # → bỏ qua filter', async () => {
      highlightFeedModel.findAll.mockResolvedValueOnce([]);
      await service.getFeed(
        undefined,
        10,
        undefined,
        undefined,
        'search',
        undefined,
        undefined,
        '   #   ',
      );
      const call = highlightFeedModel.findAll.mock.calls[0][0];
      const andList = call.where[Op.and] ?? [];
      const hasJson = andList.some((c: any) =>
        captureSql()(c)?.includes('JSON_CONTAINS('),
      );
      expect(hasJson).toBe(false);
    });

    it('combine `search` + `hashtag` → cả 2 đều áp dụng', async () => {
      highlightFeedModel.findAll.mockResolvedValueOnce([]);
      await service.getFeed(
        undefined,
        10,
        undefined,
        undefined,
        'search',
        'oauth',
        undefined,
        'security',
      );

      const call = highlightFeedModel.findAll.mock.calls[0][0];
      // search → where[Op.or] có 3 nhánh (title, course.name, hashtag-like)
      expect(call.where[Op.or]).toHaveLength(3);
      // hashtag → 1 literal JSON_CONTAINS trong Op.and
      const sql = captureSql()(call.where[Op.and][0]);
      expect(sql).toContain("JSON_QUOTE('security')");
      expect(call.subQuery).toBe(false);
    });
  });

  describe('getTrendingHashtags(days, limit)', () => {
    it('feed có 0 hashtag → items rỗng', async () => {
      highlightFeedModel.findAll.mockResolvedValue([]); // current + previous
      const res = await service.getTrendingHashtags(7, 20);
      expect(res.items).toEqual([]);
    });

    it('feed có 1 hashtag và không có kỳ trước → growthPct = null', async () => {
      highlightFeedModel.findAll
        .mockResolvedValueOnce([{ id: 1, hashtags: ['javascript'] }]) // current
        .mockResolvedValueOnce([]); // previous

      const res = await service.getTrendingHashtags(7, 20);
      expect(res.items).toEqual([
        { tag: '#javascript', count: 1, growthPct: null },
      ]);
    });

    it('feed có nhiều hashtag và có kỳ trước → tính growthPct chính xác', async () => {
      highlightFeedModel.findAll
        .mockResolvedValueOnce([
          { id: 1, hashtags: ['#javascript', '#react'] },
          { id: 2, hashtags: ['javascript', 'node'] },
          { id: 3, hashtags: ['JavaScript'] }, // case-insensitive
        ])
        .mockResolvedValueOnce([
          { id: 10, hashtags: ['javascript'] },
          { id: 11, hashtags: ['react'] },
          { id: 12, hashtags: ['react'] },
        ]);

      const res = await service.getTrendingHashtags(7, 20);
      const byTag = Object.fromEntries(res.items.map((i) => [i.tag, i]));

      // #javascript: 3 feeds (case-insensitive), prev 1 → growth +200%
      expect(byTag['#javascript']).toEqual({
        tag: '#javascript',
        count: 3,
        growthPct: 200,
      });
      // #react: 1 feed, prev 2 → growth -50%
      expect(byTag['#react']).toEqual({
        tag: '#react',
        count: 1,
        growthPct: -50,
      });
      // #node: 1 feed, prev 0 → null (mới xuất hiện)
      expect(byTag['#node']).toEqual({
        tag: '#node',
        count: 1,
        growthPct: null,
      });
    });

    it('dedupe trong 1 feed: ["javascript","#javascript"] chỉ đếm 1 lần', async () => {
      highlightFeedModel.findAll
        .mockResolvedValueOnce([{ id: 1, hashtags: ['javascript', '#javascript'] }])
        .mockResolvedValueOnce([]);

      const res = await service.getTrendingHashtags(7, 20);
      expect(res.items).toHaveLength(1);
      expect(res.items[0]).toEqual({ tag: '#javascript', count: 1, growthPct: null });
    });

    it('sắp xếp theo count giảm dần, tie-break theo tag tăng dần', async () => {
      highlightFeedModel.findAll
        .mockResolvedValueOnce([
          { id: 1, hashtags: ['b'] },
          { id: 2, hashtags: ['a'] },
          { id: 3, hashtags: ['c', 'c'] }, // c chỉ đếm 1 (dedupe trong feed)
        ])
        .mockResolvedValueOnce([]);

      const res = await service.getTrendingHashtags(7, 20);
      expect(res.items.map((i) => i.tag)).toEqual(['#a', '#b', '#c']);
    });

    it('respect param `limit`', async () => {
      highlightFeedModel.findAll
        .mockResolvedValueOnce([
          { id: 1, hashtags: ['a'] },
          { id: 2, hashtags: ['b'] },
          { id: 3, hashtags: ['c'] },
        ])
        .mockResolvedValueOnce([]);

      const res = await service.getTrendingHashtags(7, 2);
      expect(res.items).toHaveLength(2);
    });

    it('cửa sổ ngày được tính từ `days` (Op.gte current, Op.gte+Op.lt previous)', async () => {
      highlightFeedModel.findAll.mockResolvedValue([]);
      await service.getTrendingHashtags(14, 20);

      const currentCall = highlightFeedModel.findAll.mock.calls[0][0];
      const previousCall = highlightFeedModel.findAll.mock.calls[1][0];

      expect(currentCall.where.created_at[Op.gte]).toBeInstanceOf(Date);
      expect(previousCall.where.created_at[Op.gte]).toBeInstanceOf(Date);
      expect(previousCall.where.created_at[Op.lt]).toBeInstanceOf(Date);

      const currentStart = (currentCall.where.created_at[Op.gte] as Date).getTime();
      const prevStart = (previousCall.where.created_at[Op.gte] as Date).getTime();
      const prevEnd = (previousCall.where.created_at[Op.lt] as Date).getTime();

      const oneDayMs = 24 * 60 * 60 * 1000;
      // current window = 14 ngày
      expect(Math.round((Date.now() - currentStart) / oneDayMs)).toBe(14);
      // previous window kết thúc tại currentStart
      expect(prevEnd).toBe(currentStart);
      // previous window cũng dài 14 ngày
      expect(Math.round((prevEnd - prevStart) / oneDayMs)).toBe(14);
    });
  });
});
