import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Course, CourseStatus } from 'src/models/course.model';
import { TransactionItem } from 'src/models/transaction-item.model';
import { User } from 'src/users/user.model';
import {
  PaymentTransaction,
  TransactionStatus,
} from 'src/models/transaction.model';
import { InstructorRevenueTransactionItemsQueryDto } from './dto/instructor-revenue-transaction-items-query.dto';
import {
  InstructorRevenueTimeseriesQueryDto,
  RevenueGranularity,
} from './dto/instructor-revenue-timeseries-query.dto';

interface RevenueAggregateRow {
  allTime?: unknown;
  thisMonth?: unknown;
  lastMonth?: unknown;
}

interface RevenueSeriesRow {
  date: string;
  revenue?: unknown;
  enrollCount?: unknown;
}

interface RevenueCourseAggregateRow extends RevenueAggregateRow {
  courseId?: unknown;
  courseName?: string;
  enrollCount?: unknown;
}

interface RevenueCourseSeriesRow extends RevenueSeriesRow {
  courseId?: unknown;
  courseName?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

const DATE_FORMAT_BY_GRANULARITY: Record<RevenueGranularity, string> = {
  daily: '%Y-%m-%d',
  weekly: '%x-W%v',
  monthly: '%Y-%m',
};

@Injectable()
export class InstructorRevenueService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Course) private readonly courseModel: typeof Course,
    @InjectModel(TransactionItem)
    private readonly transactionItemModel: typeof TransactionItem,
    @InjectModel(User) private readonly userModel: typeof User,
  ) { }

  async getSummary(instructorId: number) {
    const now = new Date();
    const thisMonthStart = this.startOfUtcMonth(now);
    const nextMonthStart = this.addUtcMonths(thisMonthStart, 1);
    const lastMonthStart = this.addUtcMonths(thisMonthStart, -1);

    const replacements = {
      instructorId,
      thisMonthStart: this.formatSqlDateTime(thisMonthStart),
      nextMonthStart: this.formatSqlDateTime(nextMonthStart),
      lastMonthStart: this.formatSqlDateTime(lastMonthStart),
      publishedStatus: CourseStatus.PUBLISH,
    };

    const [summaryRows, courseRows] = await Promise.all([
      this.sequelize.query<RevenueAggregateRow>(
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
            END), 0) AS lastMonth
          FROM transaction_items ti
          INNER JOIN transactions t
            ON t.id = ti.transaction_id
            AND t.status = 'paid'
          INNER JOIN courses c
            ON c.id = ti.course_id
            AND c.user_id = :instructorId
            AND c.status = :publishedStatus
        `,
        {
          type: QueryTypes.SELECT,
          replacements,
        },
      ),
      this.sequelize.query<RevenueCourseAggregateRow>(
        `
          SELECT
            c.id AS courseId,
            c.name AS courseName,
            COALESCE(SUM(CASE
              WHEN t.id IS NOT NULL THEN ti.price ELSE 0
            END), 0) AS allTime,
            COALESCE(SUM(CASE
              WHEN t.id IS NOT NULL
                AND t.paid_at >= :thisMonthStart
                AND t.paid_at < :nextMonthStart
              THEN ti.price ELSE 0
            END), 0) AS thisMonth,
            COALESCE(SUM(CASE
              WHEN t.id IS NOT NULL
                AND t.paid_at >= :lastMonthStart
                AND t.paid_at < :thisMonthStart
              THEN ti.price ELSE 0
            END), 0) AS lastMonth,
            COUNT(t.id) AS enrollCount
          FROM courses c
          LEFT JOIN transaction_items ti
            ON ti.course_id = c.id
          LEFT JOIN transactions t
            ON t.id = ti.transaction_id
            AND t.status = 'paid'
          WHERE c.user_id = :instructorId
            AND c.status = :publishedStatus
          GROUP BY c.id, c.name
          ORDER BY allTime DESC, c.id ASC
        `,
        {
          type: QueryTypes.SELECT,
          replacements,
        },
      ),
    ]);

    const [row] = summaryRows;
    const allTime = this.toNumber(row?.allTime);
    const thisMonth = this.toNumber(row?.thisMonth);
    const lastMonth = this.toNumber(row?.lastMonth);

    return {
      allTime,
      thisMonth,
      lastMonth,
      growthPercent:
        lastMonth === 0
          ? null
          : this.roundCurrency(((thisMonth - lastMonth) / lastMonth) * 100),
      courses: courseRows.map((course) => {
        const courseAllTime = this.toNumber(course.allTime);
        const courseThisMonth = this.toNumber(course.thisMonth);
        const courseLastMonth = this.toNumber(course.lastMonth);

        return {
          courseId: this.toNumber(course.courseId),
          courseName: course.courseName ?? '',
          allTime: courseAllTime,
          thisMonth: courseThisMonth,
          lastMonth: courseLastMonth,
          enrollCount: this.toNumber(course.enrollCount),
          growthPercent:
            courseLastMonth === 0
              ? null
              : this.roundCurrency(
                ((courseThisMonth - courseLastMonth) / courseLastMonth) * 100,
              ),
        };
      }),
    };
  }

  async getTimeseries(
    instructorId: number,
    query: InstructorRevenueTimeseriesQueryDto,
  ) {
    const granularity = query.granularity ?? 'daily';
    const range = this.parseDateRange(query.from, query.to);
    const sqlDateFormat = DATE_FORMAT_BY_GRANULARITY[granularity];
    const toExclusive = this.addUtcDays(range.to, 1);
    const replacements = {
      instructorId,
      from: this.formatSqlDateTime(range.from),
      toExclusive: this.formatSqlDateTime(toExclusive),
      publishedStatus: CourseStatus.PUBLISH,
    };

    if (query.includeCourses) {
      const rows = await this.sequelize.query<RevenueCourseSeriesRow>(
        `
          SELECT
            DATE_FORMAT(t.paid_at, '${sqlDateFormat}') AS date,
            c.id AS courseId,
            c.name AS courseName,
            COALESCE(SUM(ti.price), 0) AS revenue,
            COUNT(ti.id) AS enrollCount
          FROM transaction_items ti
          INNER JOIN transactions t
            ON t.id = ti.transaction_id
            AND t.status = 'paid'
            AND t.paid_at IS NOT NULL
          INNER JOIN courses c
            ON c.id = ti.course_id
            AND c.user_id = :instructorId
            AND c.status = :publishedStatus
          WHERE t.paid_at >= :from AND t.paid_at < :toExclusive
          GROUP BY date, c.id, c.name
          ORDER BY date ASC, revenue DESC, c.id ASC
        `,
        {
          type: QueryTypes.SELECT,
          replacements,
        },
      );

      const aggregateByDate = new Map<
        string,
        {
          revenue: number;
          enrollCount: number;
          courses: Array<{
            courseId: number;
            courseName: string;
            revenue: number;
            enrollCount: number;
          }>;
        }
      >();

      for (const row of rows) {
        const revenue = this.roundCurrency(this.toNumber(row.revenue));
        const enrollCount = this.toNumber(row.enrollCount);
        const aggregate = aggregateByDate.get(row.date) ?? {
          revenue: 0,
          enrollCount: 0,
          courses: [],
        };

        aggregate.revenue = this.roundCurrency(aggregate.revenue + revenue);
        aggregate.enrollCount += enrollCount;
        aggregate.courses.push({
          courseId: this.toNumber(row.courseId),
          courseName: row.courseName ?? '',
          revenue,
          enrollCount,
        });
        aggregateByDate.set(row.date, aggregate);
      }

      return this.buildBuckets(range.from, range.to, granularity).map(
        (date) => {
          const aggregate = aggregateByDate.get(date);
          return {
            date,
            revenue: aggregate?.revenue ?? 0,
            enrollCount: aggregate?.enrollCount ?? 0,
            courses: aggregate?.courses ?? [],
          };
        },
      );
    }

    const rows = await this.sequelize.query<RevenueSeriesRow>(
      `
        SELECT
          DATE_FORMAT(t.paid_at, '${sqlDateFormat}') AS date,
          COALESCE(SUM(ti.price), 0) AS revenue,
          COUNT(ti.id) AS enrollCount
        FROM transaction_items ti
        INNER JOIN transactions t
          ON t.id = ti.transaction_id
          AND t.status = 'paid'
          AND t.paid_at IS NOT NULL
        INNER JOIN courses c
          ON c.id = ti.course_id
          AND c.user_id = :instructorId
          AND c.status = :publishedStatus
        WHERE t.paid_at >= :from AND t.paid_at < :toExclusive
        GROUP BY date
        ORDER BY date ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements,
      },
    );

    const aggregateByDate = new Map(
      rows.map((row) => [
        row.date,
        {
          revenue: this.roundCurrency(this.toNumber(row.revenue)),
          enrollCount: this.toNumber(row.enrollCount),
        },
      ]),
    );

    return this.buildBuckets(range.from, range.to, granularity).map((date) => ({
      date,
      revenue: aggregateByDate.get(date)?.revenue ?? 0,
      enrollCount: aggregateByDate.get(date)?.enrollCount ?? 0,
    }));
  }

  async getTransactionItems(
    instructorId: number,
    courseId: number,
    query: InstructorRevenueTransactionItemsQueryDto,
  ) {
    const range = this.parseTransactionItemsDateRange(query.from, query.to);
    const toExclusive = this.addUtcDays(range.to, 1);
    const replacements = {
      instructorId,
      courseId,
      from: this.formatSqlDateTime(range.from),
      toExclusive: this.formatSqlDateTime(toExclusive),
    };

    const course = await this.courseModel.findOne({
      attributes: ['id', 'name'],
      where: {
        id: courseId,
        userId: instructorId,
        status: CourseStatus.PUBLISH,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const rows = await this.transactionItemModel.findAll({
      attributes: ['id', 'transactionId', 'courseId', 'price'],
      where: { courseId },
      include: [
        {
          model: PaymentTransaction,
          as: 'transaction',
          attributes: [
            'id',
            'userId',
            'totalAmount',
            'paidAt',
            'provider',
            'providerOrderId',
          ],
          required: true,
          where: {
            status: TransactionStatus.PAID,
            paidAt: {
              [Op.ne]: null,
              [Op.gte]: replacements.from,
              [Op.lt]: replacements.toExclusive,
            },
          },
        },
      ],
      order: [
        [{ model: PaymentTransaction, as: 'transaction' }, 'paidAt', 'DESC'],
        [{ model: PaymentTransaction, as: 'transaction' }, 'id', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    const buyerIds = [
      ...new Set(rows.map((row) => this.toNumber(row.transaction?.userId))),
    ].filter((id) => id > 0);
    const buyerNameById = await this.resolveUserNames(buyerIds);

    const items = rows.map((row) => {
      const buyerUserId = this.toNumber(row.transaction?.userId);

      return {
        transactionItemId: this.toNumber(row.id),
        transactionId: this.toNumber(row.transaction?.id),
        buyerUserId,
        buyerName: buyerNameById.get(buyerUserId) ?? '',
        price: this.roundCurrency(this.toNumber(row.price)),
        paidAt: this.formatOutputDateTime(row.transaction?.paidAt),
        provider: row.transaction?.provider ?? '',
        providerOrderId: row.transaction?.providerOrderId ?? null,
        transactionTotalAmount: this.roundCurrency(
          this.toNumber(row.transaction?.totalAmount),
        ),
      };
    });

    return {
      courseId: this.toNumber(course.id),
      courseName: course.name ?? '',
      from: this.formatDate(range.from),
      to: this.formatDate(range.to),
      totalRevenue: this.roundCurrency(
        items.reduce((total, item) => total + item.price, 0),
      ),
      totalItems: items.length,
      items,
    };
  }

  private async resolveUserNames(ids: number[]): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    if (ids.length === 0) return map;

    const users = await this.userModel.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    for (const user of users) {
      const name = [user.lastName, user.firstName]
        .filter(Boolean)
        .join(' ')
        .trim();
      map.set(this.toNumber((user as { id: number }).id), name || user.email || '');
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

  private parseTransactionItemsDateRange(
    fromValue?: string,
    toValue?: string,
  ): DateRange {
    const hasFrom = Boolean(fromValue);
    const hasTo = Boolean(toValue);

    if (!hasFrom && !hasTo) {
      const today = this.startOfUtcDay(new Date());
      const from = this.startOfUtcMonth(today);
      const to = this.addUtcDays(this.addUtcMonths(from, 1), -1);
      return { from, to };
    }

    if (hasFrom !== hasTo) {
      throw new BadRequestException('from and to must be provided together');
    }

    const from = this.parseIsoDate(fromValue as string, 'from');
    const to = this.parseIsoDate(toValue as string, 'to');

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
    if (granularity === 'monthly') {
      return this.buildMonthlyBuckets(from, to);
    }

    if (granularity === 'weekly') {
      return this.buildWeeklyBuckets(from, to);
    }

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

  private formatOutputDateTime(value: unknown): string | null {
    if (value instanceof Date) {
      return [
        this.formatDate(value),
        [
          this.pad2(value.getUTCHours()),
          this.pad2(value.getUTCMinutes()),
          this.pad2(value.getUTCSeconds()),
        ].join(':'),
      ].join(' ');
    }

    if (typeof value === 'string') {
      return value;
    }

    return null;
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
