import { getBackendApiBaseUrl } from "@/lib/server/backend";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  const limitResponse = enforceRateLimit(request, {
    keyPrefix: "local-pipeline-stream",
    limit: 4,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const payload = await request.text();
  const upstream = await fetch(`${getBackendApiBaseUrl()}/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: payload,
    cache: "no-store",
  });

  if (!upstream.body) {
    const text = await upstream.text();
    return new Response(text || "Upstream stream unavailable", {
      status: upstream.status || 502,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
