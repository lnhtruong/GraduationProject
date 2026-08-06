import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from 'src/users/user.model';
import { CourseStatus } from 'src/models/course.model';
import { TransactionItem } from 'src/models/transaction-item.model';
import {
  PaymentTransaction,
  TransactionStatus,
} from 'src/models/transaction.model';
import {
  PaginatedResponseDto,
  PaginationMetaDto,
} from 'src/models/pagination.dto';
import {
  AdminRevenueTimeseriesQueryDto,
  RevenueGranularity,
} from './dto/admin-revenue-timeseries-query.dto';
import { AdminRevenueTransactionsQueryDto } from './dto/admin-revenue-transactions-query.dto';

interface DateRange {
  from: Date;
  to: Date;
}

const DATE_FORMAT_BY_GRANULARITY: Record<RevenueGranularity, string> = {
  daily: '%Y-%m-%d',
  weekly: '%x-W%v',
  monthly: '%Y-%m',
};

const TOP_LIMIT = 10;

@Injectable()
export class AdminRevenueService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(PaymentTransaction)
    private readonly transactionModel: typeof PaymentTransaction,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  // ── Summary (platform-wide) ───────────────────────────────────────────────
  async getSummary() {
    const now = new Date();
    const thisMonthStart = this.startOfUtcMonth(now);
    const nextMonthStart = this.addUtcMonths(thisMonthStart, 1);
    const lastMonthStart = this.addUtcMonths(thisMonthStart, -1);

    const replacements = {
      thisMonthStart: this.formatSqlDateTime(thisMonthStart),
      nextMonthStart: this.formatSqlDateTime(nextMonthStart),
      lastMonthStart: this.formatSqlDateTime(lastMonthStart),
      publishedStatus: CourseStatus.PUBLISH,
    };

    const [summaryRows, statusRows, topCourseRows, topInstructorRows] =
      await Promise.all([
        this.sequelize.query<Record<string, unknown>>(
          `
          SELECT
            COALESCE(SUM(ti.price), 0) AS allTime,
            COALESCE(SUM(CASE
              WHEN t.paid_at >= :thisMonthStart AND t.paid_at < :nextMonthStart
              THEN ti.price ELSE 0
            END), 0) AS thisMonth,
            COALESCE(SUM(CASE
              WHEN t.paid_at >= :lastMonthStart AND t.paid_at < :thisMonthStart
              THEN ti.price ELSE 0
            END), 0) AS lastMonth,
            COUNT(DISTINCT t.id) AS paidOrders,
            COUNT(ti.id) AS coursesSold
          FROM transaction_items ti
          INNER JOIN courses c
            ON c.id = ti.course_id
            AND c.status = :publishedStatus
          INNER JOIN transactions t
            ON t.id = ti.transaction_id
            AND t.status = 'paid'
          `,
          { type: QueryTypes.SELECT, replacements },
        ),
        this.sequelize.query<Record<string, unknown>>(
          `
          SELECT status, COUNT(id) AS count, COALESCE(SUM(total_amount), 0) AS amount
          FROM transactions
          GROUP BY status
          `,
          { type: QueryTypes.SELECT },
        ),
        this.sequelize.query<Record<string, unknown>>(
          `
          SELECT
            c.id AS courseId,
            c.name AS courseName,
            c.user_id AS instructorId,
            COALESCE(SUM(ti.price), 0) AS revenue,
            COUNT(ti.id) AS enrollCount
          FROM courses c
          INNER JOIN transaction_items ti ON ti.course_id = c.id
          INNER JOIN transactions t
            ON t.id = ti.transaction_id AND t.status = 'paid'
          WHERE c.status = :publishedStatus
          GROUP BY c.id, c.name, c.user_id
          ORDER BY revenue DESC, c.id ASC
          LIMIT ${TOP_LIMIT}
          `,
          { type: QueryTypes.SELECT, replacements },
        ),
        this.sequelize.query<Record<string, unknown>>(
          `
          SELECT
            c.user_id AS instructorId,
            COALESCE(SUM(ti.price), 0) AS revenue,
            COUNT(DISTINCT c.id) AS courseCount,
            COUNT(ti.id) AS enrollCount
          FROM courses c
          INNER JOIN transaction_items ti ON ti.course_id = c.id
          INNER JOIN transactions t
            ON t.id = ti.transaction_id AND t.status = 'paid'
          WHERE c.status = :publishedStatus
          GROUP BY c.user_id
          ORDER BY revenue DESC, c.user_id ASC
          LIMIT ${TOP_LIMIT}
          `,
          { type: QueryTypes.SELECT, replacements },
        ),
      ]);

    const row = summaryRows[0] ?? {};
    const allTime = this.toNumber(row.allTime);
    const thisMonth = this.toNumber(row.thisMonth);
    const lastMonth = this.toNumber(row.lastMonth);

    const statusBreakdown = this.buildStatusBreakdown(statusRows);

    const instructorIds = [
      ...new Set([
        ...topCourseRows.map((r) => this.toNumber(r.instructorId)),
        ...topInstructorRows.map((r) => this.toNumber(r.instructorId)),
      ]),
    ].filter((id) => id > 0);
    const nameById = await this.resolveUserNames(instructorIds);

    return {
      allTime,
      thisMonth,
      lastMonth,
      growthPercent:
        lastMonth === 0
          ? null
          : this.roundCurrency(((thisMonth - lastMonth) / lastMonth) * 100),
      paidOrders: this.toNumber(row.paidOrders),
      coursesSold: this.toNumber(row.coursesSold),
      statusBreakdown,
      topCourses: topCourseRows.map((r) => ({
        courseId: this.toNumber(r.courseId),
        courseName: (r.courseName as string) ?? '',
        instructorId: this.toNumber(r.instructorId),
        instructorName: nameById.get(this.toNumber(r.instructorId)) ?? '',
        revenue: this.roundCurrency(this.toNumber(r.revenue)),
        enrollCount: this.toNumber(r.enrollCount),
      })),
      topInstructors: topInstructorRows.map((r) => ({
        instructorId: this.toNumber(r.instructorId),
        instructorName: nameById.get(this.toNumber(r.instructorId)) ?? '',
        revenue: this.roundCurrency(this.toNumber(r.revenue)),
        courseCount: this.toNumber(r.courseCount),
        enrollCount: this.toNumber(r.enrollCount),
      })),
    };
  }

  // ── Timeseries (platform-wide) ────────────────────────────────────────────
  async getTimeseries(query: AdminRevenueTimeseriesQueryDto) {
    const granularity = query.granularity ?? 'daily';
    const range = this.parseDateRange(query.from, query.to);
    const sqlDateFormat = DATE_FORMAT_BY_GRANULARITY[granularity];
    const toExclusive = this.addUtcDays(range.to, 1);
    const replacements = {
      from: this.formatSqlDateTime(range.from),
      toExclusive: this.formatSqlDateTime(toExclusive),
      publishedStatus: CourseStatus.PUBLISH,
    };

    const rows = await this.sequelize.query<Record<string, unknown>>(
      `
        SELECT
          DATE_FORMAT(t.paid_at, '${sqlDateFormat}') AS date,
          COALESCE(SUM(ti.price), 0) AS revenue,
          COUNT(DISTINCT t.id) AS orderCount
        FROM transaction_items ti
        INNER JOIN courses c
          ON c.id = ti.course_id
          AND c.status = :publishedStatus
        INNER JOIN transactions t
          ON t.id = ti.transaction_id
          AND t.status = 'paid'
          AND t.paid_at IS NOT NULL
        WHERE t.paid_at >= :from AND t.paid_at < :toExclusive
        GROUP BY date
        ORDER BY date ASC
      `,
      { type: QueryTypes.SELECT, replacements },
    );

    const byDate = new Map(
      rows.map((r) => [
        r.date as string,
        {
          revenue: this.roundCurrency(this.toNumber(r.revenue)),
          orderCount: this.toNumber(r.orderCount),
        },
      ]),
    );

    return this.buildBuckets(range.from, range.to, granularity).map((date) => ({
      date,
      revenue: byDate.get(date)?.revenue ?? 0,
      orderCount: byDate.get(date)?.orderCount ?? 0,
    }));
  }

  // ── Revenue by category (extended) ────────────────────────────────────────
  async getByCategory(fromValue?: string, toValue?: string) {
    const range = this.parseDateRange(fromValue, toValue);
    const toExclusive = this.addUtcDays(range.to, 1);
    const replacements = {
      from: this.formatSqlDateTime(range.from),
      toExclusive: this.formatSqlDateTime(toExclusive),
      publishedStatus: CourseStatus.PUBLISH,
    };

    const rows = await this.sequelize.query<Record<string, unknown>>(
      `
        SELECT c.categories AS categories, ti.price AS price
        FROM transaction_items ti
        INNER JOIN transactions t
          ON t.id = ti.transaction_id
          AND t.status = 'paid'
          AND t.paid_at IS NOT NULL
        INNER JOIN courses c
          ON c.id = ti.course_id
          AND c.status = :publishedStatus
        WHERE t.paid_at >= :from AND t.paid_at < :toExclusive
      `,
      { type: QueryTypes.SELECT, replacements },
    );

    const byCategory = new Map<string, { revenue: number; count: number }>();
    for (const r of rows) {
      const price = this.toNumber(r.price);
      for (const category of this.parseCategories(r.categories)) {
        const entry = byCategory.get(category) ?? { revenue: 0, count: 0 };
        entry.revenue += price;
        entry.count += 1;
        byCategory.set(category, entry);
      }
    }

    return Array.from(byCategory.entries())
      .map(([category, entry]) => ({
        category,
        revenue: this.roundCurrency(entry.revenue),
        enrollCount: entry.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  // ── Transactions list (extended, paginated) ───────────────────────────────
  async getTransactions(query: AdminRevenueTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.from || query.to) {
      const range = this.parseDateRange(query.from, query.to);
      where.createdAt = {
        [Op.gte]: this.formatSqlDateTime(range.from),
        [Op.lt]: this.formatSqlDateTime(this.addUtcDays(range.to, 1)),
      };
    }

    const { rows, count } = await this.transactionModel.findAndCountAll({
      where,
      include: [{ model: TransactionItem, as: 'items', attributes: ['id'] }],
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      offset,
      distinct: true,
    });

    const buyerIds = [...new Set(rows.map((r) => r.userId))].filter(
      (id) => id > 0,
    );
    const nameById = await this.resolveUserNames(buyerIds);

    const data = rows.map((r) => ({
      id: r.id,
      buyerUserId: r.userId,
      buyerName: nameById.get(r.userId) ?? '',
      totalAmount: this.roundCurrency(this.toNumber(r.totalAmount)),
      status: r.status,
      provider: r.provider,
      providerOrderId: r.providerOrderId,
      itemCount: r.items?.length ?? 0,
      createdAt: r.createdAt,
      paidAt: r.paidAt,
    }));

    return new PaginatedResponseDto(
      data,
      new PaginationMetaDto(page, limit, count),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private buildStatusBreakdown(rows: Record<string, unknown>[]) {
    const base: Record<TransactionStatus, { count: number; amount: number }> = {
      [TransactionStatus.PAID]: { count: 0, amount: 0 },
      [TransactionStatus.PENDING]: { count: 0, amount: 0 },
      [TransactionStatus.FAILED]: { count: 0, amount: 0 },
    };
    for (const r of rows) {
      const status = r.status as TransactionStatus;
      if (status in base) {
        base[status] = {
          count: this.toNumber(r.count),
          amount: this.roundCurrency(this.toNumber(r.amount)),
        };
      }
    }
    return base;
  }

  private parseCategories(raw: unknown): string[] {
    let value: unknown = raw;
    if (typeof value === 'string') {
      const str = value;
      try {
        value = JSON.parse(str);
      } catch {
        return str.trim() ? [str.trim()] : [];
      }
    }
    if (Array.isArray(value)) {
      return value
        .map((c) =>
          typeof c === 'string'
            ? c
            : typeof c === 'object' && c !== null
              ? String((c as Record<string, unknown>).name ?? '')
              : String(c),
        )
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
    }
    return [];
  }

  private async resolveUserNames(ids: number[]): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    if (ids.length === 0) return map;
    const users = await this.userModel.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id', 'firstName', 'lastName'],
    });
    for (const user of users) {
      const name = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      map.set(this.toNumber((user as { id: number }).id), name);
    }
    return map;
  }

  private parseDateRange(fromValue?: string, toValue?: string): DateRange {
    const today = this.startOfUtcDay(new Date());
    let from = fromValue ? this.parseIsoDate(fromValue, 'from') : undefined;
    let to = toValue ? this.parseIsoDate(toValue, 'to') : undefined;

    if (!from && !to) {
      to = today;
      from = this.addUtcDays(to, -29);
    } else if (from && !to) {
      to = this.addUtcDays(from, 29);
    } else if (!from && to) {
      from = this.addUtcDays(to, -29);
    }

    if (!from || !to) {
      throw new BadRequestException('Invalid date range');
    }
    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('from must be before or equal to to');
    }
    return { from, to };
  }

  private parseIsoDate(value: string, fieldName: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(
        `${fieldName} must be a valid ISO date string`,
      );
    }
    return this.startOfUtcDay(parsed);
  }

  private buildBuckets(
    from: Date,
    to: Date,
    granularity: RevenueGranularity,
  ): string[] {
    if (granularity === 'monthly') return this.buildMonthlyBuckets(from, to);
    if (granularity === 'weekly') return this.buildWeeklyBuckets(from, to);
    return this.buildDailyBuckets(from, to);
  }

  private buildDailyBuckets(from: Date, to: Date): string[] {
    const buckets: string[] = [];
    for (let cursor = from; cursor <= to; cursor = this.addUtcDays(cursor, 1)) {
      buckets.push(this.formatDate(cursor));
    }
    return buckets;
  }

  private buildWeeklyBuckets(from: Date, to: Date): string[] {
    const buckets: string[] = [];
    let cursor = this.startOfIsoWeek(from);
    const end = this.startOfIsoWeek(to);
    while (cursor <= end) {
      buckets.push(this.formatIsoWeek(cursor));
      cursor = this.addUtcDays(cursor, 7);
    }
    return buckets;
  }

  private buildMonthlyBuckets(from: Date, to: Date): string[] {
    const buckets: string[] = [];
    let cursor = this.startOfUtcMonth(from);
    const end = this.startOfUtcMonth(to);
    while (cursor <= end) {
      buckets.push(this.formatMonth(cursor));
      cursor = this.addUtcMonths(cursor, 1);
    }
    return buckets;
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private startOfUtcMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private startOfIsoWeek(date: Date): Date {
    const day = date.getUTCDay() || 7;
    return this.addUtcDays(this.startOfUtcDay(date), 1 - day);
  }

  private addUtcDays(date: Date, amount: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + amount);
    return next;
  }

  private addUtcMonths(date: Date, amount: number): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1),
    );
  }

  private formatDate(date: Date): string {
    return [
      date.getUTCFullYear(),
      this.pad2(date.getUTCMonth() + 1),
      this.pad2(date.getUTCDate()),
    ].join('-');
  }

  private formatMonth(date: Date): string {
    return `${date.getUTCFullYear()}-${this.pad2(date.getUTCMonth() + 1)}`;
  }

  private formatSqlDateTime(date: Date): string {
    return `${this.formatDate(date)} 00:00:00`;
  }

  private formatIsoWeek(date: Date): string {
    const normalized = this.startOfUtcDay(date);
    normalized.setUTCDate(
      normalized.getUTCDate() + 4 - (normalized.getUTCDay() || 7),
    );
    const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
      ((normalized.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${normalized.getUTCFullYear()}-W${this.pad2(week)}`;
  }

  private pad2(value: number): string {
    return String(value).padStart(2, '0');
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }
}
