const redis = require("./redis");
const crypto = require("crypto");

// How long to keep translations cached
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;  // 30 days

// Track cache stats (useful for monitoring)
let cacheHits = 0;
let cacheMisses = 0;

async function translateWithCache(text, targetLang, sourceLang = "auto") {
  // ── Step 1: Build cache key ──────────────────────────
  // Hash the text so special characters don't cause issues
  const textHash = crypto
    .createHash("sha256")
    .update(text.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);  // first 16 chars is enough for uniqueness

  const cacheKey = `translation:${textHash}:${sourceLang}:${targetLang}`;

  // ── Step 2: Check cache first ────────────────────────
  try {
    const cached = await redis.get(cacheKey);

    if (cached) {
      cacheHits++;
      console.log(`💾 Cache HIT [${sourceLang}→${targetLang}]:`,
                  text.slice(0, 30) + "...");
      return {
        translatedText: cached,
        fromCache: true,
        cacheKey
      };
    }
  } catch (redisErr) {
    // Redis failed — just skip cache and call API
    console.warn("Redis get failed, skipping cache:", redisErr.message);
  }

  // ── Step 3: Cache miss — call translation API ────────
  cacheMisses++;
  console.log(`🌐 Cache MISS [${sourceLang}→${targetLang}]:`,
              text.slice(0, 30) + "...");

  const translatedText = await callTranslationAPI(
    text,
    targetLang,
    sourceLang
  );

  // ── Step 4: Save to cache ────────────────────────────
  try {
    await redis.set(cacheKey, translatedText, "EX", CACHE_TTL_SECONDS);
  } catch (redisErr) {
    // Cache save failed — not critical, just log it
    console.warn("Redis set failed:", redisErr.message);
  }

  return {
    translatedText,
    fromCache: false,
    cacheKey
  };
}

// Delegate translation call to underlying uncached translation service
async function callTranslationAPI(text, targetLang, sourceLang) {
  const mockTranslator = require('../services/mockTranslator');
  return mockTranslator.translate(text, sourceLang, targetLang);
}

// Export stats for monitoring endpoint
function getCacheStats() {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate: total > 0
      ? ((cacheHits / total) * 100).toFixed(1) + "%"
      : "0%",
    moneySaved: `~$${(cacheHits * 0.00002 * 50).toFixed(4)}`
    // estimate: avg 50 chars per message × Google price
  };
}

module.exports = { translateWithCache, getCacheStats };
