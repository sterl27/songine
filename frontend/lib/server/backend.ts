export function getBackendApiBaseUrl(): string {
  const direct =
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";

  return direct.endsWith("/") ? direct.slice(0, -1) : direct;
}
