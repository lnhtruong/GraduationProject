const router = require('express').Router();
const { mailController } = require('../controllers');
const { validateEmail, otpRateLimit } = require('../middlewares');

router.post('/otp', validateEmail, otpRateLimit, mailController.sendOTP);
router.post('/forgot-password', validateEmail, mailController.sendForgotPassword);
router.post('/custom', validateEmail, mailController.sendCustom);

module.exports = router;
