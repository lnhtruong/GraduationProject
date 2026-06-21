const { QueryTypes } = require('sequelize');
const db = require('../models');
const sequelize = db.sequelize;

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcGrowth(thisMonth, lastMonth) {
    if (!lastMonth || lastMonth === 0) return null;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 10000) / 100;
}

function startOfMonth(offsetMonths = 0) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + offsetMonths);
    return d;
}

function endOfMonth(offsetMonths = 0) {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    d.setMonth(d.getMonth() + offsetMonths + 1, 0);
    return d;
}

// ── API 1: Summary ───────────────────────────────────────────────────────────

const getSummary = async (userId) => {
    const thisMonthStart = startOfMonth(0);
    const thisMonthEnd = endOfMonth(0);
    const lastMonthStart = startOfMonth(-1);
    const lastMonthEnd = endOfMonth(-1);

    const rows = await sequelize.query(
        `SELECT
            c.id          AS courseId,
            c.name        AS courseName,
            COALESCE(SUM(ti.price), 0) AS allTime,
            COALESCE(SUM(CASE WHEN t.paid_at >= :thisStart AND t.paid_at <= :thisEnd THEN ti.price ELSE 0 END), 0) AS thisMonth,
            COALESCE(SUM(CASE WHEN t.paid_at >= :lastStart AND t.paid_at <= :lastEnd THEN ti.price ELSE 0 END), 0) AS lastMonth,
            COUNT(ti.id)  AS soldCount
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN courses c      ON c.id = ti.course_id
        WHERE c.user_id = :userId
          AND t.status  = 'paid'
        GROUP BY c.id, c.name`,
        {
            replacements: {
                userId,
                thisStart: thisMonthStart,
                thisEnd: thisMonthEnd,
                lastStart: lastMonthStart,
                lastEnd: lastMonthEnd,
            },
            type: QueryTypes.SELECT,
        }
    );

    const courses = rows.map((r) => ({
        courseId: r.courseId,
        courseName: r.courseName,
        allTime: Number(r.allTime),
        thisMonth: Number(r.thisMonth),
        lastMonth: Number(r.lastMonth),
        soldCount: Number(r.soldCount),
        growthPercent: calcGrowth(Number(r.thisMonth), Number(r.lastMonth)),
    }));

    const allTime = courses.reduce((s, c) => s + c.allTime, 0);
    const thisMonth = courses.reduce((s, c) => s + c.thisMonth, 0);
    const lastMonth = courses.reduce((s, c) => s + c.lastMonth, 0);

    return {
        allTime,
        thisMonth,
        lastMonth,
        growthPercent: calcGrowth(thisMonth, lastMonth),
        courses,
    };
};

// ── API 2: Timeseries ────────────────────────────────────────────────────────

const getTimeseries = async (userId, { from, to, granularity }) => {
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = `${new Date().getFullYear()}-01-01`;

    const fromDate = from || yearStart;
    const toDate = to || today;
    const gran = ['daily', 'weekly', 'monthly'].includes(granularity) ? granularity : 'monthly';

    let dateExpr;
    if (gran === 'daily') {
        dateExpr = "DATE_FORMAT(t.paid_at, '%Y-%m-%d')";
    } else if (gran === 'weekly') {
        dateExpr = "CONCAT(YEAR(t.paid_at), '-W', LPAD(WEEK(t.paid_at, 1), 2, '0'))";
    } else {
        dateExpr = "DATE_FORMAT(t.paid_at, '%Y-%m')";
    }

    const rows = await sequelize.query(
        `SELECT
            ${dateExpr}             AS \`date\`,
            COALESCE(SUM(ti.price), 0) AS revenue,
            COUNT(ti.id)            AS soldCount
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN courses c      ON c.id = ti.course_id
        WHERE c.user_id = :userId
          AND t.status  = 'paid'
          AND DATE(t.paid_at) BETWEEN :from AND :to
        GROUP BY \`date\`
        ORDER BY \`date\` ASC`,
        {
            replacements: { userId, from: fromDate, to: toDate },
            type: QueryTypes.SELECT,
        }
    );

    return rows.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
        soldCount: Number(r.soldCount),
    }));
};

// ── API 3: Transaction items for a course ────────────────────────────────────

const getTransactionItems = async (userId, courseId, { from, to }) => {
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = `${new Date().getFullYear()}-01-01`;

    const fromDate = from || yearStart;
    const toDate = to || today;

    const [course] = await sequelize.query(
        'SELECT id, name FROM courses WHERE id = :courseId AND user_id = :userId LIMIT 1',
        { replacements: { courseId, userId }, type: QueryTypes.SELECT }
    );

    if (!course) {
        const err = new Error('Course not found or does not belong to this user');
        err.status = 404;
        throw err;
    }

    const items = await sequelize.query(
        `SELECT
            ti.id               AS transactionItemId,
            ti.transaction_id   AS transactionId,
            ti.price,
            t.user_id           AS buyerUserId,
            t.total_amount      AS transactionTotalAmount,
            t.provider,
            t.provider_order_id AS providerOrderId,
            t.paid_at           AS paidAt
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN courses c      ON c.id = ti.course_id
        WHERE c.user_id    = :userId
          AND ti.course_id = :courseId
          AND t.status     = 'paid'
          AND DATE(t.paid_at) BETWEEN :from AND :to
        ORDER BY t.paid_at DESC`,
        {
            replacements: { userId, courseId, from: fromDate, to: toDate },
            type: QueryTypes.SELECT,
        }
    );

    const totalRevenue = items.reduce((s, r) => s + Number(r.price), 0);

    return {
        courseId: Number(courseId),
        courseName: course.name,
        from: fromDate,
        to: toDate,
        totalRevenue,
        totalItems: items.length,
        items: items.map((r) => ({
            transactionItemId: r.transactionItemId,
            transactionId: r.transactionId,
            buyerUserId: r.buyerUserId,
            price: Number(r.price),
            paidAt: r.paidAt,
            provider: r.provider,
            providerOrderId: r.providerOrderId,
            transactionTotalAmount: Number(r.transactionTotalAmount),
        })),
    };
};

module.exports = { getSummary, getTimeseries, getTransactionItems };
