import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import type { Song } from "../components/SongCard";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-aa7dba7b`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
};

// ─── Error Helpers ──────────────────────────────────────────────

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.error || `Request failed with status ${response.status}`;
  } catch {
    const text = await response.text().catch(() => "");
    return text || `Request failed with status ${response.status}`;
  }
}

// ─── Retry Logic ────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;
const REQUEST_TIMEOUT_MS = 12_000;

function timeoutError(url: string, timeoutMs: number): Error {
  return new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(timeoutError(url, timeoutMs)), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, REQUEST_TIMEOUT_MS);
      // Don't retry client errors (4xx), only server errors (5xx) or network issues
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      if (attempt < retries) {
        console.log(`Retry ${attempt + 1}/${retries} for ${url} (status ${response.status})`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      return response;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (attempt < retries) {
        console.log(
          `Retry ${attempt + 1}/${retries} for ${url} (${isAbort ? "timeout" : "network error"})`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      if (isAbort) {
        throw timeoutError(url, REQUEST_TIMEOUT_MS);
      }
      throw err;
    }
  }
  throw new Error(`Failed after ${retries + 1} attempts: ${url}`);
}

// ─── Song API ───────────────────────────────────────────────────

export async function initializeDatabase(): Promise<{ success: boolean; count: number }> {
  const response = await fetchWithRetry(`${API_BASE_URL}/songs/init`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function searchSongs(query: string): Promise<Song[]> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/songs/search?q=${encodeURIComponent(query)}`,
    { headers }
  );

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getRandomSong(): Promise<Song> {
  const response = await fetchWithRetry(`${API_BASE_URL}/songs/random`, { headers });

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getAllSongs(): Promise<Song[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/songs`, { headers });

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getSongById(id: string): Promise<Song> {
  const response = await fetchWithRetry(`${API_BASE_URL}/songs/${id}`, { headers });

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

// ─── AI Analysis API ────────────────────────────────────────────

export interface AIAnalysis {
  summary: string;
  mood: string;
  genre_hints: string[];
  production_notes: string;
  dj_tips: string;
  similar_artists: string[];
  fun_fact: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _viteEnv = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (import.meta as any).env as Record<string, string> | undefined;
  } catch {
    return undefined;
  }
})();

const LOCAL_AGENT_URL: string = _viteEnv?.["VITE_LOCAL_AGENT_URL"] || "http://localhost:8000";
const OPENROUTER_API_KEY: string = _viteEnv?.["VITE_OPENROUTER_API_KEY"] ?? "";
const OPENROUTER_MODEL: string =
  _viteEnv?.["VITE_OPENROUTER_MODEL"] ?? "nousresearch/hermes-3-llama-3.1-405b:free";

export type AISource = "local" | "openrouter" | "cloud";
export interface AIAnalysisResult {
  analysis: AIAnalysis;
  source: AISource;
}

async function getLocalAIAnalysis(song: Song): Promise<AIAnalysis> {
  const response = await fetchWithTimeout(
    `${LOCAL_AGENT_URL}/api/agent/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song }),
    },
    8_000,
  );
  if (!response.ok) throw new Error(`Local agent: ${response.status}`);
  return response.json();
}

async function getOpenRouterAIAnalysis(song: Song): Promise<AIAnalysis> {
  if (!OPENROUTER_API_KEY) throw new Error("No OpenRouter API key configured");

  const prompt = [
    `Song: "${song.title}" by ${song.artist ?? "Unknown"}`,
    song.album ? `Album: ${song.album}` : "",
    song.analysis?.tempo ? `BPM: ${Math.round(song.analysis.tempo)}` : "",
    song.analysis?.key ? `Key: ${song.analysis.key} ${song.analysis.mode ?? ""}`.trim() : "",
    song.releaseYear ? `Year: ${song.releaseYear}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://songine.app",
        "X-Title": "Songine",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
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
    },
    15_000,
  );

  if (!response.ok) throw new Error(`OpenRouter: ${response.status}`);
  const json = await response.json();
  const content: string = json.choices?.[0]?.message?.content ?? "";
  // Strip optional markdown fences
  const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as AIAnalysis;
}

export async function getAIAnalysis(song: Song): Promise<AIAnalysisResult> {
  // 1. Prefer local Hermes agent
  try {
    const analysis = await getLocalAIAnalysis(song);
    return { analysis, source: "local" };
  } catch {
    // Fall through
  }

  // 2. Try cached Supabase result
  try {
    const cachedResponse = await fetchWithRetry(`${API_BASE_URL}/ai/analyze/${song.id}`, { headers }, 0);
    if (cachedResponse.ok) {
      return { analysis: await cachedResponse.json(), source: "cloud" };
    }
  } catch {
    // No cache
  }

  // 3. Try generating via Supabase cloud AI
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/ai/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ song }),
    });
    if (response.ok) {
      return { analysis: await response.json(), source: "cloud" };
    }
  } catch {
    // Fall through to OpenRouter
  }

  // 4. OpenRouter as 2nd fallback
  const analysis = await getOpenRouterAIAnalysis(song);
  return { analysis, source: "openrouter" };
}

// ─── MIR Search API ─────────────────────────────────────────────

export interface MIRSearchResult {
  song_id: string;
  relevance_score: number;
  reason: string;
  song: Song;
}

export interface MIRSearchResponse {
  interpretation: string;
  feature_focus: string[];
  results: MIRSearchResult[];
}

export async function mirSearch(query: string): Promise<MIRSearchResponse> {
  const response = await fetchWithRetry(`${API_BASE_URL}/ai/mir-search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
}

// ─── Favorites (localStorage) ───────────────────────────────────

const FAVORITES_KEY = "musaix-pro-favorites";

export function getFavorites(): Song[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavorite(song: Song): Song[] {
  const favorites = getFavorites();
  if (favorites.some((s) => s.id === song.id)) return favorites;
  const updated = [song, ...favorites];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

export function removeFavorite(songId: string): Song[] {
  const favorites = getFavorites().filter((s) => s.id !== songId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

export function isFavorite(songId: string): boolean {
  return getFavorites().some((s) => s.id === songId);
}

// ─── History (localStorage) ─────────────────────────────────────

const HISTORY_KEY = "musaix-pro-history";
const MAX_HISTORY = 20;

export function getHistory(): Song[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToHistory(song: Song): Song[] {
  const history = getHistory().filter((s) => s.id !== song.id);
  const updated = [song, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory(): Song[] {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  return [];
}
