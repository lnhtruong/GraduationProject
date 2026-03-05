const redis = require("redis");
require("dotenv").config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

/**
 * Tạo Redis subscriber
 * Dùng cho các service khác subscribe to payment webhook events
 */
class EventSubscriber {
  constructor() {
    this.subscriberClient = redis.createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      password: REDIS_PASSWORD || undefined,
      legacyMode: true, // Enable callback-based API
    });

    this.subscriberClient.on("connect", () => {
      console.log("✅ Redis subscriber connected");
    });

    this.subscriberClient.on("ready", () => {
      console.log("✅ Redis subscriber ready");
    });

    this.subscriberClient.on("error", (err) => {
      console.error("❌ Redis subscriber error:", err.message);
    });

    this.subscriberClient.on("message", (channel, message) => {
      this.handleMessage(channel, message);
    });

    this.handlers = {};

    // Connect to Redis
    this.subscriberClient.connect().catch((err) => {
      console.error("❌ Failed to connect Redis subscriber:", err.message);
    });
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {function} handler - Callback function
   */
  subscribe(channel, handler) {
    if (!this.handlers[channel]) {
      this.handlers[channel] = [];
      this.subscriberClient.subscribe(channel).catch((err) => {
        console.error(`❌ Lỗi subscribe channel '${channel}':`, err.message);
      });
      console.log(`✅ Subscribed to channel '${channel}'`);
    }

    this.handlers[channel].push(handler);
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   */
  unsubscribe(channel) {
    delete this.handlers[channel];
    this.subscriberClient.unsubscribe(channel).catch((err) => {
      console.error(`❌ Lỗi unsubscribe channel '${channel}':`, err.message);
    });
    console.log(`✅ Unsubscribed from channel '${channel}'`);
  }

  /**
   * Handle message from Redis
   */
  handleMessage(channel, message) {
    try {
      const data = JSON.parse(message);
      const channelHandlers = this.handlers[channel] || [];

      channelHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Lỗi xử lý event '${channel}':`, error.message);
        }
      });
    } catch (error) {
      console.error(`❌ Lỗi parse message từ '${channel}':`, error.message);
    }
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.subscriberClient) {
      this.subscriberClient.quit().catch((err) => {
        console.error("❌ Error disconnecting Redis subscriber:", err.message);
      });
      console.log("✅ Redis subscriber disconnected");
    }
  }
}

// Singleton instance
let eventSubscriberInstance = null;

/**
 * Get or create EventSubscriber instance
 */
const getEventSubscriber = () => {
  if (!eventSubscriberInstance) {
    eventSubscriberInstance = new EventSubscriber();
  }
  return eventSubscriberInstance;
};

module.exports = {
  EventSubscriber,
  getEventSubscriber,
};
