const router = require('express').Router();
const { mailController } = require('../controllers');
const { validateEmail } = require('../middlewares');

router.post('/otp', validateEmail, mailController.sendOTP);
router.post('/forgot-password', validateEmail, mailController.sendForgotPassword);
router.post('/custom', validateEmail, mailController.sendCustom);

module.exports = router;
