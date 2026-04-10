const express = require('express');
const paymentRoute = require('./payment.route');

const router = express.Router();

router.use('/', paymentRoute);

module.exports = router;
