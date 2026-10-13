import Redis from "ioredis";

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export function initRedis(): void {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Do not spam retries if Redis is not running
    });

    redisClient.on("connect", () => {
      isRedisAvailable = true;
      console.log("Redis connected successfully for caching");
    });

    redisClient.on("error", (err) => {
      isRedisAvailable = false;
      // Soft warning - Redis is an optional bonus feature
      // console.warn("Redis unavailable, proceeding without cache:", err.message);
    });
  } catch (error) {
    isRedisAvailable = false;
    console.warn("Could not initialize Redis client, falling back to direct DB queries.");
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redisClient || !isRedisAvailable) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedData(
  key: string,
  value: unknown,
  ttlSeconds = 60
): Promise<void> {
  if (!redisClient || !isRedisAvailable) return;
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Ignore cache write failure
  }
}

export async function invalidateCache(key: string): Promise<void> {
  if (!redisClient || !isRedisAvailable) return;
  try {
    await redisClient.del(key);
  } catch {
    // Ignore cache deletion failure
  }
}
