module.exports.validateEmail = require('./validate.middleware').validateEmail;
module.exports.errorMiddleware = require('./error.middleware');
module.exports.otpRateLimit = require('./rate-limit.middleware').otpRateLimit;
