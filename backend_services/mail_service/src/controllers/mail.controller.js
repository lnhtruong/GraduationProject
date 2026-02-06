const { mailService } = require('../services');
const { generateOTP } = require('../utils');

exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    await mailService.sendOTP(email, otp);
    res.json({ statusCode: 200, message: 'OTP sent' });
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
