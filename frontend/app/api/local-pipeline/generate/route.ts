import { getBackendApiBaseUrl } from "@/lib/server/backend";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const limitResponse = enforceRateLimit(request, {
    keyPrefix: "local-pipeline-generate",
    limit: 8,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const payload = await request.text();
  const upstream = await fetch(`${getBackendApiBaseUrl()}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}
