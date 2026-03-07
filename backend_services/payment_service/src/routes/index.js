const express = require('express');
const paymentRoute = require('./payment.route');

const router = express.Router();

router.use('/payment', paymentRoute);

module.exports = router;
