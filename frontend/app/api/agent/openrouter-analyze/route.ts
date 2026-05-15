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
  const openRouterModel =
    process.env.OPENROUTER_MODEL ??
    process.env.openrouter_model ??
    "nousresearch/hermes-3-llama-3.1-405b:free";

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

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://songine.vercel.app",
      "X-Title": "Songine",
    },
    body: JSON.stringify({
      model: openRouterModel,
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
    return new Response(
      JSON.stringify({
        error: `OpenRouter request failed (${upstream.status})`,
        detail: upstreamBody.slice(0, 500),
      }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  const upstreamJson = (await upstream.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = upstreamJson.choices?.[0]?.message?.content ?? "";

  try {
    const analysis = JSON.parse(normalizeJsonBlock(content)) as AIAnalysis;
    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "OpenRouter response was not valid JSON", raw: content.slice(0, 500) }),
      {
        status: 502,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }
}
