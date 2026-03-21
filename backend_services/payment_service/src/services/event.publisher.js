const redis = require("redis");
require("dotenv").config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Tạo Redis publisher client với API mới (redis v4+)
const publisherClient = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
  password: REDIS_PASSWORD || undefined,
  // Đã bỏ legacyMode: true để hỗ trợ Promise-based API cho get, set, publish
});

let isConnected = false;

publisherClient.on("connect", () => {
  console.log("✅ Redis publisher connected");
  isConnected = true;
});

publisherClient.on("ready", () => {
  console.log("✅ Redis publisher ready");
  isConnected = true;
});

publisherClient.on("error", (err) => {
  console.error("❌ Redis publisher error:", err.message);
  isConnected = false;
});

publisherClient.on("end", () => {
  console.log("🔌 Redis publisher disconnected");
  isConnected = false;
});

// Connect to Redis
publisherClient.connect().catch((err) => {
  console.error("❌ Failed to connect Redis publisher:", err.message);
  isConnected = false;
});

/**
 * Publish webhook event
 * @param {string} channel - Channel name (e.g., "payment:webhook")
 * @param {object} data - Event data
 */
const publishEvent = async (channel, data) => {
  try {
    // Check if Redis is connected
    if (!isConnected) {
      console.warn(`⚠️ Redis không kết nối, bỏ qua publish event '${channel}'`);
      return;
    }

    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Sử dụng Promise-based API (redis v4+)
    const numSubscribers = await publisherClient.publish(channel, message);
    console.log(
      `📢 Event '${channel}' published to ${numSubscribers} subscriber(s)`
    );
  } catch (error) {
    console.error(
      `❌ Lỗi khi publish event '${channel}':`,
      error.message
    );
  }
};

/**
 * Publish payment webhook event
 */
const publishPaymentWebhook = (webhookData) => {
  publishEvent("payment:webhook", {
    type: "PAYMENT_WEBHOOK",
    data: webhookData,
  });
};

/**
 * Publish payment success event
 */
const publishPaymentSuccess = (orderCode, webhookData) => {
  publishEvent("payment:success", {
    type: "PAYMENT_SUCCESS",
    orderCode,
    data: webhookData,
  });
};

/**
 * Publish payment failed event
 */
const publishPaymentFailed = (orderCode, reason) => {
  publishEvent("payment:failed", {
    type: "PAYMENT_FAILED",
    orderCode,
    reason,
  });
};

/**
 * Lưu dữ liệu payment vào Redis
 */
const savePaymentData = async (orderCode, data) => {
  try {
    if (!isConnected) {
      console.warn("⚠️ Redis không kết nối, bỏ qua lưu dữ liệu payment");
      return;
    }
    const key = `PAYMENT_${orderCode}`;
    await publisherClient.set(key, JSON.stringify(data));
    await publisherClient.expire(key, 86400); // 24 hours
    console.log(`✅ Đã lưu data vào Redis với key: ${key}`);
  } catch (error) {
    console.error(`❌ Lỗi khi lưu payment data vào Redis:`, error.message);
  }
};

/**
 * Lấy dữ liệu payment từ Redis
 */
const getPaymentData = async (orderCode) => {
  try {
    if (!isConnected) {
      return null;
    }
    const key = `PAYMENT_${orderCode}`;
    const data = await publisherClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy payment data từ Redis:`, error.message);
    return null;
  }
};

module.exports = {
  publishEvent,
  publishPaymentWebhook,
  publishPaymentSuccess,
  publishPaymentFailed,
  savePaymentData,
  getPaymentData,
};

