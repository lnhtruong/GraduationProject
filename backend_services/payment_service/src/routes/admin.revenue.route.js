const { Router } = require('express');
const { getSummary, getTimeseries, getTransactionItems } = require('../controllers/admin.revenue.controller');

const router = Router();

// GET /admin/revenue/users/:userId/summary
router.get('/users/:userId/summary', getSummary);

// GET /admin/revenue/users/:userId/timeseries
router.get('/users/:userId/timeseries', getTimeseries);

// GET /admin/revenue/users/:userId/courses/:courseId/transaction-items
router.get('/users/:userId/courses/:courseId/transaction-items', getTransactionItems);

module.exports = router;
