import { getBackendApiBaseUrl } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const upstream = await fetch(`${getBackendApiBaseUrl()}/api/agent/health`, {
      cache: "no-store",
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ status: "error", detail: "Backend unreachable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
