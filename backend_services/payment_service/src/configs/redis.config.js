const redis = require("redis");
require("dotenv").config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Tạo Redis client
const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: (options) => {
    if (options.error && options.error.code === "ECONNREFUSED") {
      console.error("❌ Redis connection refused");
      return new Error("Redis connection refused");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error("Redis retry time exhausted");
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

redisClient.on("connect", () => {
  console.log("✅ Redis client connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis client error:", err);
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis client reconnecting...");
});

module.exports = redisClient;
