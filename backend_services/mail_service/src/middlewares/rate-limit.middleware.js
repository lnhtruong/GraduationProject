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

    // Atomic INCR + EXPIRE via Lua. TTL is set on the first hit and
    // refreshed once at the moment the counter first exceeds MAX_REQUESTS,
    // so the lockout is exactly WINDOW_SECONDS from when the limit tripped,
    // not from the first request in the burst. Refreshing only on the
    // boundary (not every blocked call) prevents an attacker from keeping
    // the key alive forever via continued spam.
    const script = `
      local v = redis.call('INCR', KEYS[1])
      if v == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      elseif v == tonumber(ARGV[2]) + 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return v
    `;
    const count = Number(
      await redis.eval(script, 1, key, WINDOW_SECONDS, MAX_REQUESTS),
    );

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
