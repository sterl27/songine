import { enforceRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

type Song = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  releaseYear?: number;
  analysis?: {
    tempo?: number;
    key?: string;
    mode?: string;
  };
};

type AIAnalysis = {
  summary: string;
  mood: string;
  genre_hints: string[];
  production_notes: string;
  dj_tips: string;
  similar_artists: string[];
  fun_fact: string;
};

type OpenRouterChoicePayload = {
  choices?: Array<{ message?: { content?: string } }>;
};

const DEFAULT_NEMOTRON_MODELS = [
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
];

function normalizeJsonBlock(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function buildPrompt(song: Song): string {
  return [
    `Song: "${song.title}" by ${song.artist ?? "Unknown"}`,
    song.album ? `Album: ${song.album}` : "",
    song.analysis?.tempo ? `BPM: ${Math.round(song.analysis.tempo)}` : "",
    song.analysis?.key ? `Key: ${song.analysis.key} ${song.analysis.mode ?? ""}`.trim() : "",
    song.releaseYear ? `Year: ${song.releaseYear}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request): Promise<Response> {
  const limitResponse = await enforceRateLimit(request, {
    keyPrefix: "agent-openrouter-analyze",
    limit: 10,
    windowMs: 60_000,
  });
  if (limitResponse) return limitResponse;

  const openRouterKey =
    process.env.OPENROUTER_API_KEY ?? process.env.openrouter_api_key;
  const configuredModel = process.env.OPENROUTER_MODEL ?? process.env.openrouter_model;
  const modelCandidates = configuredModel
    ? configuredModel
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean)
    : DEFAULT_NEMOTRON_MODELS;

  if (!openRouterKey) {
    return new Response(
      JSON.stringify({ error: "Server OpenRouter key is not configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  let body: { song?: Song };
  try {
    body = (await request.json()) as { song?: Song };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  if (!body.song?.title) {
    return new Response(JSON.stringify({ error: "Song payload is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const prompt = buildPrompt(body.song);

  const failures: string[] = [];

  for (const model of modelCandidates) {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://songine.vercel.app",
        "X-Title": "Songine",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a music analyst. Return ONLY a valid JSON object (no markdown) with keys: " +
              "summary, mood, genre_hints (array), production_notes, dj_tips, similar_artists (array), fun_fact.",
          },
          { role: "user", content: `Analyze this track:\n${prompt}` },
        ],
        temperature: 0.7,
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const upstreamBody = await upstream.text();
      failures.push(`${model}: ${upstream.status} ${upstreamBody.slice(0, 180)}`);
      continue;
    }

    const upstreamJson = (await upstream.json()) as OpenRouterChoicePayload;
    const content = upstreamJson.choices?.[0]?.message?.content ?? "";

    try {
      const analysis = JSON.parse(normalizeJsonBlock(content)) as AIAnalysis;
      return new Response(JSON.stringify(analysis), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-OpenRouter-Model": model,
        },
      });
    } catch {
      failures.push(`${model}: response was not valid JSON (${content.slice(0, 180)})`);
    }
  }

  return new Response(
    JSON.stringify({
      error: "OpenRouter request failed for all configured models",
      detail: failures.slice(0, 3),
    }),
    {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }
  );
}
