const redis = require('../configs/redis.config');

const WINDOW_SECONDS = 5 * 60; // 5 minutes
const MAX_REQUESTS = 3;

// Per-email rate limit for /mail/otp. Independent from auth_service's
// per-IP limit; protects against direct abuse of this service.
async function otpRateLimit(req, res, next) {
  try {
    const rawEmail = req.body && req.body.email;
    if (!rawEmail) {
      return next();
    }
    const email = String(rawEmail).trim().toLowerCase();
    const key = `RATE_LIMIT:MAIL_OTP:${email}`;

    // Atomic INCR + EXPIRE-on-first-hit via Lua to avoid races.
    const script = `
      local v = redis.call('INCR', KEYS[1])
      if v == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return v
    `;
    const count = Number(await redis.eval(script, 1, key, WINDOW_SECONDS));

    if (count > MAX_REQUESTS) {
      const ttl = await redis.ttl(key);
      const retryAfter = ttl > 0 ? ttl : WINDOW_SECONDS;
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { otpRateLimit };
