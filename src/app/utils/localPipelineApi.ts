export interface MelodyData {
  min_pitch: number;
  max_pitch: number;
  pitch_range: number;
  contour: number[];
  confidence: number[];
}

export interface MirData {
  tempo: number;
  key: string;
  key_confidence: number;
  duration_sec: number;
  chords: string[];
  danceability: number;
  loudness: number;
  dynamic_complexity: number;
  energy_curve: number[];
  melody: MelodyData;
}

export interface GenerateResponse {
  job_id: string;
  prompt: string;
  raw: string;
  stems: Record<string, string>;
  mir: MirData;
  uploads?: Record<string, string>;
}

export interface GenerateRequest {
  prompt: string;
  duration?: number;
  instrumental?: boolean;
}

const runtimeEnv = typeof process !== "undefined" ? process.env : undefined;

const nextProxyBase =
  runtimeEnv?.NEXT_PUBLIC_LOCAL_PIPELINE_PROXY_PATH ?? "/api/local-pipeline";

export const LOCAL_PIPELINE_BASE_URL =
  runtimeEnv ? nextProxyBase : "http://localhost:8000";

export async function generateLocalBeat(
  payload: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${LOCAL_PIPELINE_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Generation failed (${response.status})`);
  }

  return response.json();
}

export function getPipelineFileUrl(filename: string): string {
  return `${LOCAL_PIPELINE_BASE_URL}/file/${encodeURIComponent(filename)}`;
}

export async function streamGenerateLocalBeat(
  payload: GenerateRequest,
  handlers: {
    onMessage?: (message: string) => void;
    onResult?: (result: GenerateResponse) => void;
    onError?: (error: string) => void;
  }
): Promise<void> {
  const response = await fetch(`${LOCAL_PIPELINE_BASE_URL}/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(detail || `Streaming failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event.split("\n");
      let eventName = "message";
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      const data = dataLines.join("\n");
      if (!data) continue;

      if (eventName === "result") {
        try {
          handlers.onResult?.(JSON.parse(data) as GenerateResponse);
        } catch {
          handlers.onError?.("Failed to parse streamed result payload");
        }
      } else if (eventName === "error") {
        handlers.onError?.(data);
      } else {
        handlers.onMessage?.(data);
      }
    }
  }
}
