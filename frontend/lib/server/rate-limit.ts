const LIMIT_STORE = new Map<string, number[]>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

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

export function enforceRateLimit(request: Request, options: RateLimitOptions): Response | null {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${options.keyPrefix ?? "global"}:${ip}`;

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
