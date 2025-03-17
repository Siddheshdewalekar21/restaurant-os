import { Redis } from 'ioredis';

// Create Redis instance
const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  
  // Default to localhost if no REDIS_URL is provided
  return 'redis://localhost:6379';
};

// Global is used here to maintain a cached connection across hot reloads in development
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(getRedisUrl());

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Cache helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache<T>(key: string, data: T, expireInSeconds = 60 * 5): Promise<void> {
  await redis.set(key, JSON.stringify(data), 'EX', expireInSeconds);
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export default redis; 