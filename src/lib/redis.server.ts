import { Redis } from "@upstash/redis";

let _redis: Redis | null | undefined;

/**
 * Returns a shared Upstash Redis client, or `null` when env vars are missing.
 * Callers should treat `null` as "cache disabled" and fall back to the source
 * of truth (Supabase) — never throw.
 */
export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _redis = null;
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

/** Safe get — swallows errors and returns null so a Redis hiccup never breaks a request. */
export async function safeGet<T = unknown>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return (await r.get<T>(key)) ?? null;
  } catch (e) {
    console.warn("[redis] get failed", key, e);
    return null;
  }
}

/** Safe set with TTL (seconds). Swallows errors. */
export async function safeSetEx(key: string, ttlSeconds: number, value: unknown): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSeconds });
  } catch (e) {
    console.warn("[redis] set failed", key, e);
  }
}

/** Safe delete. Swallows errors. */
export async function safeDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(...keys);
  } catch (e) {
    console.warn("[redis] del failed", keys, e);
  }
}