const express = require('express');
const mailRoute = require('./mail.route');

const router = express.Router();

router.use('/mail', mailRoute);

module.exports = router;
