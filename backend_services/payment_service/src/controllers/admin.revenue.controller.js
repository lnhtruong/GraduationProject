const adminRevenueService = require('../services/admin.revenue.service');

const getSummary = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (!userId) return res.status(400).json({ error: 'userId không hợp lệ' });

        const data = await adminRevenueService.getSummary(userId);
        res.json(data);
    } catch (err) {
        console.error('adminRevenue.getSummary:', err.message);
        res.status(err.status || 500).json({ error: err.message || 'Lỗi server' });
    }
};

const getTimeseries = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (!userId) return res.status(400).json({ error: 'userId không hợp lệ' });

        const { from, to, granularity } = req.query;
        const data = await adminRevenueService.getTimeseries(userId, { from, to, granularity });
        res.json(data);
    } catch (err) {
        console.error('adminRevenue.getTimeseries:', err.message);
        res.status(err.status || 500).json({ error: err.message || 'Lỗi server' });
    }
};

const getTransactionItems = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const courseId = Number(req.params.courseId);
        if (!userId || !courseId) return res.status(400).json({ error: 'userId hoặc courseId không hợp lệ' });

        const { from, to } = req.query;
        const data = await adminRevenueService.getTransactionItems(userId, courseId, { from, to });
        res.json(data);
    } catch (err) {
        console.error('adminRevenue.getTransactionItems:', err.message);
        res.status(err.status || 500).json({ error: err.message || 'Lỗi server' });
    }
};

module.exports = { getSummary, getTimeseries, getTransactionItems };
