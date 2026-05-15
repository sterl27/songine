const LIMIT_STORE = new Map<string, number[]>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

async function hitRedisRateLimit(key: string, windowMs: number): Promise<number | null> {
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
    return null;
  }

  const encodedKey = encodeURIComponent(key);

  try {
    const incrResponse = await fetch(`${REDIS_REST_URL}/incr/${encodedKey}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_REST_TOKEN}` },
      cache: "no-store",
    });

    if (!incrResponse.ok) {
      return null;
    }

    const incrPayload = (await incrResponse.json()) as { result?: number };
    const count = Number(incrPayload.result ?? 0);
    if (!Number.isFinite(count) || count <= 0) {
      return null;
    }

    if (count === 1) {
      const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
      await fetch(`${REDIS_REST_URL}/expire/${encodedKey}/${ttlSeconds}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${REDIS_REST_TOKEN}` },
        cache: "no-store",
      });
    }

    return count;
  } catch {
    return null;
  }
}

export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions
): Promise<Response | null> {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${options.keyPrefix ?? "global"}:${ip}`;

  const sharedCount = await hitRedisRateLimit(key, options.windowMs);
  if (sharedCount !== null) {
    if (sharedCount > options.limit) {
      const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please retry shortly.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return null;
  }

  const current = LIMIT_STORE.get(key) ?? [];
  const inWindow = current.filter((timestamp) => now - timestamp < options.windowMs);

  if (inWindow.length >= options.limit) {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please retry shortly.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  inWindow.push(now);
  LIMIT_STORE.set(key, inWindow);
  return null;
}
