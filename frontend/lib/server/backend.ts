export function getBackendApiBaseUrl(): string {
  const direct =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    null;

  if (!direct) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[backend] BACKEND_API_URL is not set — all /api/local-pipeline requests will fail in production. Set this environment variable in your Vercel project settings."
      );
    }
    return "http://localhost:8000";
  }

  return direct.endsWith("/") ? direct.slice(0, -1) : direct;
}
