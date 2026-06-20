const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;  // stop retrying after 3 attempts
    return Math.min(times * 200, 1000);
  },
  enableOfflineQueue: false
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  // Don't crash app if Redis fails
  // just log and fall through to API
  console.warn("⚠️ Redis error (non-fatal):", err.message);
});

module.exports = redis;
