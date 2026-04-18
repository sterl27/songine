import { getBackendApiBaseUrl } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ filename: string }>;
}

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { filename } = await params;
  const safeFilename = encodeURIComponent(filename);

  const upstream = await fetch(`${getBackendApiBaseUrl()}/file/${safeFilename}`, {
    cache: "no-store",
  });

  if (!upstream.body) {
    const text = await upstream.text();
    return new Response(text || "File stream unavailable", {
      status: upstream.status || 502,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
