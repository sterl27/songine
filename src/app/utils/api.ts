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

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
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
      if (attempt < retries) {
        console.log(`Retry ${attempt + 1}/${retries} for ${url} (network error)`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
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

export async function getAIAnalysis(song: Song): Promise<AIAnalysis> {
  // Try cached first
  try {
    const cachedResponse = await fetchWithRetry(`${API_BASE_URL}/ai/analyze/${song.id}`, { headers }, 0);
    if (cachedResponse.ok) {
      return cachedResponse.json();
    }
  } catch {
    // No cache, proceed to generate
  }

  const response = await fetchWithRetry(`${API_BASE_URL}/ai/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify({ song }),
  });

  if (!response.ok) {
    const errorMsg = await parseErrorResponse(response);
    throw new Error(errorMsg);
  }

  return response.json();
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
