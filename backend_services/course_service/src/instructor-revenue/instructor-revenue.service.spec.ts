import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { InstructorRevenueService } from './instructor-revenue.service';

describe('InstructorRevenueService', () => {
  let query: jest.Mock;
  let courseModel: { findOne: jest.Mock };
  let transactionItemModel: { findAll: jest.Mock };
  let service: InstructorRevenueService;

  beforeEach(() => {
    query = jest.fn();
    courseModel = { findOne: jest.fn() };
    transactionItemModel = { findAll: jest.fn() };
    service = new InstructorRevenueService(
      { query } as any,
      courseModel as any,
      transactionItemModel as any,
    );
  });

  it('returns null growthPercent when lastMonth is zero', async () => {
    query
      .mockResolvedValueOnce([
        { allTime: '300000', thisMonth: '100000', lastMonth: '0' },
      ])
      .mockResolvedValueOnce([
        {
          courseId: '11',
          courseName: 'NestJS Basics',
          allTime: '300000',
          thisMonth: '100000',
          lastMonth: '0',
          enrollCount: '3',
        },
      ]);

    const result = await service.getSummary(7);

    expect(result).toEqual({
      allTime: 300000,
      thisMonth: 100000,
      lastMonth: 0,
      growthPercent: null,
      courses: [
        {
          courseId: 11,
          courseName: 'NestJS Basics',
          allTime: 300000,
          thisMonth: 100000,
          lastMonth: 0,
          enrollCount: 3,
          growthPercent: null,
        },
      ],
    });
  });

  it('keeps zero-revenue instructor courses in summary breakdown', async () => {
    query
      .mockResolvedValueOnce([
        { allTime: '300000', thisMonth: '100000', lastMonth: '50000' },
      ])
      .mockResolvedValueOnce([
        {
          courseId: '11',
          courseName: 'No Sales Yet',
          allTime: '0',
          thisMonth: '0',
          lastMonth: '0',
          enrollCount: '0',
        },
      ]);

    const result = await service.getSummary(7);

    expect(result.courses).toEqual([
      {
        courseId: 11,
        courseName: 'No Sales Yet',
        allTime: 0,
        thisMonth: 0,
        lastMonth: 0,
        enrollCount: 0,
        growthPercent: null,
      },
    ]);

    const [courseBreakdownSql] = query.mock.calls[1];
    expect(courseBreakdownSql).toContain('FROM courses c');
    expect(courseBreakdownSql).toContain('LEFT JOIN transaction_items ti');
    expect(courseBreakdownSql).toContain('LEFT JOIN transactions t');
    expect(courseBreakdownSql).toContain('WHERE c.user_id = :instructorId');
  });

  it('filters all revenue queries by instructor course ownership', async () => {
    query.mockResolvedValueOnce([]);

    await service.getTimeseries(9, {
      from: '2026-01-01',
      to: '2026-01-31',
      granularity: 'daily',
    });

    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain('c.user_id = :instructorId');
    expect(sql).toContain("t.status = 'paid'");
    expect(options.replacements.instructorId).toBe(9);
  });

  it('binds timeseries date range as MySQL datetime strings without timezone shift', async () => {
    query.mockResolvedValueOnce([]);

    await service.getTimeseries(9, {
      from: '2025-10-12',
      to: '2025-10-12',
      granularity: 'daily',
    });

    const [, options] = query.mock.calls[0];
    expect(options.replacements.from).toBe('2025-10-12 00:00:00');
    expect(options.replacements.toExclusive).toBe('2025-10-13 00:00:00');
  });

  it('returns all 12 monthly buckets including zero revenue months', async () => {
    query.mockResolvedValueOnce([]);

    const result = await service.getTimeseries(1, {
      from: '2026-01-01',
      to: '2026-12-31',
      granularity: 'monthly',
    });

    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ date: '2026-01', revenue: 0, enrollCount: 0 });
    expect(result[11]).toEqual({ date: '2026-12', revenue: 0, enrollCount: 0 });
  });

  it('fills missing daily buckets and keeps aggregate rows', async () => {
    query.mockResolvedValueOnce([
      { date: '2026-05-02', revenue: '250000', enrollCount: '2' },
    ]);

    const result = await service.getTimeseries(1, {
      from: '2026-05-01',
      to: '2026-05-03',
      granularity: 'daily',
    });

    expect(result).toEqual([
      { date: '2026-05-01', revenue: 0, enrollCount: 0 },
      { date: '2026-05-02', revenue: 250000, enrollCount: 2 },
      { date: '2026-05-03', revenue: 0, enrollCount: 0 },
    ]);
  });

  it('adds per-course breakdown to timeseries when includeCourses is true', async () => {
    query.mockResolvedValueOnce([
      {
        date: '2026-05-02',
        courseId: '10',
        courseName: 'Course A',
        revenue: '100000',
        enrollCount: '1',
      },
      {
        date: '2026-05-02',
        courseId: '20',
        courseName: 'Course B',
        revenue: '250000',
        enrollCount: '2',
      },
    ]);

    const result = await service.getTimeseries(1, {
      from: '2026-05-01',
      to: '2026-05-02',
      granularity: 'daily',
      includeCourses: true,
    });

    expect(result).toEqual([
      { date: '2026-05-01', revenue: 0, enrollCount: 0, courses: [] },
      {
        date: '2026-05-02',
        revenue: 350000,
        enrollCount: 3,
        courses: [
          {
            courseId: 10,
            courseName: 'Course A',
            revenue: 100000,
            enrollCount: 1,
          },
          {
            courseId: 20,
            courseName: 'Course B',
            revenue: 250000,
            enrollCount: 2,
          },
        ],
      },
    ]);

    const [sql] = query.mock.calls[0];
    expect(sql).toContain('GROUP BY date, c.id, c.name');
  });

  it('throws BadRequestException when from is after to', async () => {
    await expect(
      service.getTimeseries(1, {
        from: '2026-06-01',
        to: '2026-05-01',
        granularity: 'daily',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query).not.toHaveBeenCalled();
  });

  it('lists paid transaction items for an owned course in a date range', async () => {
    courseModel.findOne.mockResolvedValueOnce({
      id: 10,
      name: 'Course A',
    });
    transactionItemModel.findAll.mockResolvedValueOnce([
      {
        id: 101,
        transactionId: 501,
        price: 150000,
        transaction: {
          id: 501,
          userId: 31,
          paidAt: '2026-05-12 10:30:00',
          provider: 'payos',
          providerOrderId: 'PO-501',
          totalAmount: 250000,
        },
      },
      {
        id: 102,
        transactionId: 502,
        price: 200000,
        transaction: {
          id: 502,
          userId: 32,
          paidAt: '2026-05-13 09:00:00',
          provider: 'payos',
          providerOrderId: null,
          totalAmount: 200000,
        },
      },
    ]);

    const result = await service.getTransactionItems(7, 10, {
      from: '2026-05-01',
      to: '2026-05-31',
    });

    expect(result).toEqual({
      courseId: 10,
      courseName: 'Course A',
      from: '2026-05-01',
      to: '2026-05-31',
      totalRevenue: 350000,
      totalItems: 2,
      items: [
        {
          transactionItemId: 101,
          transactionId: 501,
          buyerUserId: 31,
          price: 150000,
          paidAt: '2026-05-12 10:30:00',
          provider: 'payos',
          providerOrderId: 'PO-501',
          transactionTotalAmount: 250000,
        },
        {
          transactionItemId: 102,
          transactionId: 502,
          buyerUserId: 32,
          price: 200000,
          paidAt: '2026-05-13 09:00:00',
          provider: 'payos',
          providerOrderId: null,
          transactionTotalAmount: 200000,
        },
      ],
    });

    expect(courseModel.findOne).toHaveBeenCalledWith({
      attributes: ['id', 'name'],
      where: {
        id: 10,
        userId: 7,
        status: 'publish',
      },
    });

    const [findAllOptions] = transactionItemModel.findAll.mock.calls[0];
    expect(findAllOptions.where).toEqual({ courseId: 10 });
    expect(findAllOptions.include[0]).toMatchObject({
      as: 'transaction',
      required: true,
      where: {
        status: 'paid',
      },
    });
    expect(findAllOptions.include[0].where.paidAt[Op.ne]).toBeNull();
    expect(findAllOptions.include[0].where.paidAt[Op.gte]).toBe(
      '2026-05-01 00:00:00',
    );
    expect(findAllOptions.include[0].where.paidAt[Op.lt]).toBe(
      '2026-06-01 00:00:00',
    );
  });

  it('defaults transaction item range to the current month', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
    courseModel.findOne.mockResolvedValueOnce({
      id: 10,
      name: 'Course A',
    });
    transactionItemModel.findAll.mockResolvedValueOnce([]);

    try {
      const result = await service.getTransactionItems(7, 10, {});

      expect(result.from).toBe('2026-05-01');
      expect(result.to).toBe('2026-05-31');

      const [findAllOptions] = transactionItemModel.findAll.mock.calls[0];
      expect(findAllOptions.include[0].where.paidAt[Op.gte]).toBe(
        '2026-05-01 00:00:00',
      );
      expect(findAllOptions.include[0].where.paidAt[Op.lt]).toBe(
        '2026-06-01 00:00:00',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('throws BadRequestException when transaction item range is one-sided', async () => {
    await expect(
      service.getTransactionItems(7, 10, { from: '2026-05-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query).not.toHaveBeenCalled();
    expect(courseModel.findOne).not.toHaveBeenCalled();
    expect(transactionItemModel.findAll).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when course is not owned by instructor', async () => {
    courseModel.findOne.mockResolvedValueOnce(null);

    await expect(
      service.getTransactionItems(7, 10, {
        from: '2026-05-01',
        to: '2026-05-31',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(courseModel.findOne).toHaveBeenCalledTimes(1);
    expect(transactionItemModel.findAll).not.toHaveBeenCalled();
  });
});
