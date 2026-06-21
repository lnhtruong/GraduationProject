const express = require('express');
const paymentRoute = require('./payment.route');
const adminRevenueRoute = require('./admin.revenue.route');

const router = express.Router();

router.use('/', paymentRoute);
router.use('/admin/revenue', adminRevenueRoute);

module.exports = router;
