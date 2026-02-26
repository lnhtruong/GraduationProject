const { mailService } = require('../services');
const { generateOTP } = require('../utils');
const redis = require('../configs/redis.config');

exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();

    const emailKey = email.trim().toLowerCase();
    await redis.set(`MAIL_OTP:${emailKey}`, otp, 'EX', 300); // 5 mins

    await mailService.sendOTP(emailKey, otp);

    res.json({
      statusCode: 200,
      message: 'OTP sent',
      // data: { otp },
    });
  } catch (err) {
    next(err);
  }
};


exports.sendForgotPassword = async (req, res, next) => {
  try {
    const { email, link } = req.body;
    await mailService.sendForgotPassword(email, link);
    res.json({ statusCode: 200, message: 'Reset email sent' });
  } catch (err) {
    next(err);
  }
};

exports.sendCustom = async (req, res, next) => {
  try {
    const { email, message } = req.body;
    await mailService.sendCustom(email, message);
    res.json({ statusCode: 200, message: 'Mail sent' });
  } catch (err) {
    next(err);
  }
};
