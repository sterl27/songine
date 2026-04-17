import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-aa7dba7b/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Fuzzy matching utility ─────────────────────────────────────
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  // Exact match = highest
  if (t === q) return 100;
  // Starts with = very high
  if (t.startsWith(q)) return 90;
  // Contains = high
  if (t.includes(q)) return 80;
  // Fuzzy = lower
  if (fuzzyMatch(q, t)) return 60;
  return 0;
}

// Initialize database with default songs
app.post("/make-server-aa7dba7b/songs/init", async (c) => {
  try {
    // Check if songs already exist to make this idempotent
    const existingIds = await kv.get("song:all_ids");
    if (existingIds && Array.isArray(existingIds) && existingIds.length > 0) {
      console.log(`Database already initialized with ${existingIds.length} songs, skipping`);
      return c.json({ success: true, count: existingIds.length, skipped: true });
    }

    const defaultSongs = [
      {
        id: "1",
        title: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        duration: 200,
        releaseYear: 2020,
        imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
        analysis: {
          tempo: 171,
          key: "F#",
          mode: "Major",
          timeSignature: "4/4",
          energy: 0.73,
          danceability: 0.51,
          valence: 0.33,
          acousticness: 0.001,
          instrumentalness: 0.0,
          liveness: 0.14,
          speechiness: 0.06,
          loudness: -5.9,
        },
      },
      {
        id: "2",
        title: "Levitating",
        artist: "Dua Lipa",
        album: "Future Nostalgia",
        duration: 203,
        releaseYear: 2020,
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        analysis: {
          tempo: 103,
          key: "B",
          mode: "Major",
          timeSignature: "4/4",
          energy: 0.82,
          danceability: 0.70,
          valence: 0.92,
          acousticness: 0.003,
          instrumentalness: 0.0,
          liveness: 0.11,
          speechiness: 0.05,
          loudness: -3.8,
        },
      },
      {
        id: "3",
        title: "Shape of You",
        artist: "Ed Sheeran",
        album: "÷ (Divide)",
        duration: 234,
        releaseYear: 2017,
        imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
        analysis: {
          tempo: 96,
          key: "C#",
          mode: "Minor",
          timeSignature: "4/4",
          energy: 0.65,
          danceability: 0.83,
          valence: 0.93,
          acousticness: 0.58,
          instrumentalness: 0.0,
          liveness: 0.09,
          speechiness: 0.08,
          loudness: -3.2,
        },
      },
      {
        id: "4",
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 354,
        releaseYear: 1975,
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        analysis: {
          tempo: 144,
          key: "Bb",
          mode: "Major",
          timeSignature: "4/4",
          energy: 0.43,
          danceability: 0.30,
          valence: 0.22,
          acousticness: 0.30,
          instrumentalness: 0.0,
          liveness: 0.26,
          speechiness: 0.04,
          loudness: -8.7,
        },
      },
      {
        id: "5",
        title: "Watermelon Sugar",
        artist: "Harry Styles",
        album: "Fine Line",
        duration: 174,
        releaseYear: 2019,
        imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
        analysis: {
          tempo: 95,
          key: "E",
          mode: "Major",
          timeSignature: "4/4",
          energy: 0.82,
          danceability: 0.55,
          valence: 0.96,
          acousticness: 0.12,
          instrumentalness: 0.0,
          liveness: 0.33,
          speechiness: 0.05,
          loudness: -4.2,
        },
      },
    ];

    // Store each song
    for (const song of defaultSongs) {
      await kv.set(`song:${song.id}`, song);
    }

    // Store all song IDs for easy retrieval
    const songIds = defaultSongs.map((s) => s.id);
    await kv.set("song:all_ids", songIds);

    console.log(`Initialized database with ${defaultSongs.length} songs`);
    return c.json({ success: true, count: defaultSongs.length });
  } catch (error) {
    console.error("Error initializing database:", error);
    return c.json({ error: `Database initialization error: ${error.message}` }, 500);
  }
});

// Get all songs
app.get("/make-server-aa7dba7b/songs", async (c) => {
  try {
    const songIds = await kv.get("song:all_ids");
    
    if (!songIds || songIds.length === 0) {
      return c.json([]);
    }

    const songKeys = songIds.map((id: string) => `song:${id}`);
    const songs = await kv.mget(songKeys);
    
    return c.json(songs.filter((song) => song !== null));
  } catch (error) {
    console.error("Error fetching all songs:", error);
    return c.json({ error: `Error fetching songs: ${error.message}` }, 500);
  }
});

// Search songs
app.get("/make-server-aa7dba7b/songs/search", async (c) => {
  try {
    const query = c.req.query("q")?.toLowerCase();
    
    if (!query) {
      return c.json([]);
    }

    const songIds = await kv.get("song:all_ids");
    
    if (!songIds || songIds.length === 0) {
      return c.json([]);
    }

    const songKeys = songIds.map((id: string) => `song:${id}`);
    const songs = await kv.mget(songKeys);
    
    // Score each song using fuzzy matching across title, artist, album
    const scoredSongs = songs
      .filter((song: any) => song !== null)
      .map((song: any) => {
        const titleScore = fuzzyScore(query, song.title);
        const artistScore = fuzzyScore(query, song.artist);
        const albumScore = fuzzyScore(query, song.album);
        const bestScore = Math.max(titleScore, artistScore, albumScore);
        return { song, score: bestScore };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ song }) => song);
    
    return c.json(scoredSongs);
  } catch (error) {
    console.error("Error searching songs:", error);
    return c.json({ error: `Error searching songs: ${error.message}` }, 500);
  }
});

// Get random song
app.get("/make-server-aa7dba7b/songs/random", async (c) => {
  try {
    const songIds = await kv.get("song:all_ids");
    
    if (!songIds || songIds.length === 0) {
      return c.json({ error: "No songs available" }, 404);
    }

    const randomId = songIds[Math.floor(Math.random() * songIds.length)];
    const song = await kv.get(`song:${randomId}`);
    
    return c.json(song);
  } catch (error) {
    console.error("Error fetching random song:", error);
    return c.json({ error: `Error fetching random song: ${error.message}` }, 500);
  }
});

// Get song by ID
app.get("/make-server-aa7dba7b/songs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const song = await kv.get(`song:${id}`);
    
    if (!song) {
      return c.json({ error: "Song not found" }, 404);
    }
    
    return c.json(song);
  } catch (error) {
    console.error("Error fetching song by ID:", error);
    return c.json({ error: `Error fetching song: ${error.message}` }, 500);
  }
});

// XAI-powered AI song analysis
app.post("/make-server-aa7dba7b/ai/analyze", async (c) => {
  try {
    const xaiApiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiApiKey) {
      console.log("XAI_API_KEY not found in environment variables");
      return c.json({ error: "XAI API key not configured. Please add XAI_API_KEY to your environment." }, 500);
    }

    const { song } = await c.req.json();
    if (!song) {
      return c.json({ error: "Song data is required for AI analysis" }, 400);
    }

    const prompt = `You are a professional music analyst and critic for a premium music analysis app called "Musaix Pro". Analyze the following song based on its audio features and provide insightful commentary.

Song: "${song.title}" by ${song.artist}
Album: ${song.album} (${song.releaseYear})
Duration: ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}

Audio Features:
- Tempo: ${song.analysis.tempo} BPM
- Key: ${song.analysis.key} ${song.analysis.mode}
- Time Signature: ${song.analysis.timeSignature}
- Energy: ${(song.analysis.energy * 100).toFixed(0)}%
- Danceability: ${(song.analysis.danceability * 100).toFixed(0)}%
- Valence (mood/happiness): ${(song.analysis.valence * 100).toFixed(0)}%
- Acousticness: ${(song.analysis.acousticness * 100).toFixed(0)}%
- Instrumentalness: ${(song.analysis.instrumentalness * 100).toFixed(0)}%
- Liveness: ${(song.analysis.liveness * 100).toFixed(0)}%
- Speechiness: ${(song.analysis.speechiness * 100).toFixed(0)}%
- Loudness: ${song.analysis.loudness} dB

Respond with a JSON object (no markdown, just raw JSON) with these fields:
{
  "summary": "A 2-3 sentence high-level overview of the song's character and appeal",
  "mood": "One or two words describing the overall mood (e.g. 'Euphoric', 'Melancholic Energy')",
  "genre_hints": ["array", "of", "likely", "genre", "tags"],
  "production_notes": "2-3 sentences about the production style based on the audio features",
  "dj_tips": "A short tip for DJs about mixing this track (BPM compatibility, energy level, etc.)",
  "similar_artists": ["array", "of", "3-4", "similar", "artists"],
  "fun_fact": "An interesting observation or fun fact about the song or its audio characteristics"
}`;

    console.log(`Calling XAI API for song analysis: "${song.title}" by ${song.artist}`);

    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini-fast",
        messages: [
          {
            role: "system",
            content: "You are a music analysis AI. Always respond with valid JSON only, no markdown formatting or code blocks."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text();
      console.log(`XAI API error (${xaiResponse.status}): ${errorText}`);
      return c.json({ error: `XAI API error: ${xaiResponse.status} - ${errorText}` }, 500);
    }

    const xaiData = await xaiResponse.json();
    console.log("XAI API response received successfully");

    const content = xaiData.choices?.[0]?.message?.content;
    if (!content) {
      console.log("XAI API returned empty content");
      return c.json({ error: "XAI API returned empty response" }, 500);
    }

    // Parse the JSON response, stripping any markdown code blocks if present
    let analysisResult;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.log(`Failed to parse XAI response as JSON: ${content}`);
      // Fallback: return the raw text as summary
      analysisResult = {
        summary: content,
        mood: "Unknown",
        genre_hints: [],
        production_notes: "",
        dj_tips: "",
        similar_artists: [],
        fun_fact: ""
      };
    }

    // Cache the result in KV
    await kv.set(`ai_analysis:${song.id}`, analysisResult);

    return c.json(analysisResult);
  } catch (error) {
    console.log(`Error in AI analysis endpoint: ${error.message}`);
    return c.json({ error: `AI analysis error: ${error.message}` }, 500);
  }
});

// Get cached AI analysis
app.get("/make-server-aa7dba7b/ai/analyze/:songId", async (c) => {
  try {
    const songId = c.req.param("songId");
    const cached = await kv.get(`ai_analysis:${songId}`);
    
    if (!cached) {
      return c.json({ error: "No cached analysis found" }, 404);
    }
    
    return c.json(cached);
  } catch (error) {
    console.log(`Error fetching cached AI analysis: ${error.message}`);
    return c.json({ error: `Error fetching cached analysis: ${error.message}` }, 500);
  }
});

// AI MIR (Music Information Retrieval) Search
app.post("/make-server-aa7dba7b/ai/mir-search", async (c) => {
  try {
    const xaiApiKey = Deno.env.get("XAI_API_KEY");
    if (!xaiApiKey) {
      console.log("XAI_API_KEY not found for MIR search");
      return c.json({ error: "XAI API key not configured." }, 500);
    }

    const { query } = await c.req.json();
    if (!query || !query.trim()) {
      return c.json({ error: "Search query is required" }, 400);
    }

    // Fetch all songs from the database
    const songIds = await kv.get("song:all_ids");
    if (!songIds || songIds.length === 0) {
      return c.json({ results: [], interpretation: "No songs in the database to search." });
    }

    const songKeys = songIds.map((id: string) => `song:${id}`);
    const songs = await kv.mget(songKeys);
    const validSongs = songs.filter((s: any) => s !== null);

    // Build a compact representation of the catalog for the AI
    const catalogSummary = validSongs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      album: s.album,
      year: s.releaseYear,
      tempo: s.analysis.tempo,
      key: `${s.analysis.key} ${s.analysis.mode}`,
      energy: Math.round(s.analysis.energy * 100),
      danceability: Math.round(s.analysis.danceability * 100),
      valence: Math.round(s.analysis.valence * 100),
      acousticness: Math.round(s.analysis.acousticness * 100),
      instrumentalness: Math.round(s.analysis.instrumentalness * 100),
      liveness: Math.round(s.analysis.liveness * 100),
      speechiness: Math.round(s.analysis.speechiness * 100),
      loudness: s.analysis.loudness,
    }));

    const prompt = `You are an AI-powered Music Information Retrieval (MIR) engine for "Musaix Pro". 
A user has made a natural language search query about music. Your job is to interpret what musical characteristics they're looking for and rank the songs in the catalog by relevance.

USER QUERY: "${query}"

SONG CATALOG (with audio features as percentages):
${JSON.stringify(catalogSummary, null, 2)}

Instructions:
- Interpret the user's intent. They might describe moods ("something sad"), characteristics ("fast tempo", "acoustic"), activities ("good for working out"), genres ("something funky"), eras ("80s vibes"), or even abstract concepts ("songs that feel like summer").
- Rank ALL songs by relevance to the query. Every song must appear exactly once.
- For each song, provide a relevance score (0-100) and a brief reason explaining the match.
- Also provide an overall interpretation of what the user is looking for.

Respond with valid JSON only (no markdown):
{
  "interpretation": "What the AI understood the user is looking for (1-2 sentences)",
  "feature_focus": ["array", "of", "key", "audio", "features", "relevant", "to", "query"],
  "ranked_results": [
    {
      "song_id": "id",
      "relevance_score": 85,
      "reason": "Brief explanation of why this song matches"
    }
  ]
}`;

    console.log(`MIR Search query: "${query}"`);

    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini-fast",
        messages: [
          {
            role: "system",
            content: "You are a Music Information Retrieval AI. Always respond with valid JSON only, no markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text();
      console.log(`XAI API MIR error (${xaiResponse.status}): ${errorText}`);
      return c.json({ error: `XAI API error: ${xaiResponse.status} - ${errorText}` }, 500);
    }

    const xaiData = await xaiResponse.json();
    const content = xaiData.choices?.[0]?.message?.content;

    if (!content) {
      console.log("XAI MIR returned empty content");
      return c.json({ error: "AI returned empty response" }, 500);
    }

    let mirResult;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mirResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.log(`Failed to parse MIR response: ${content}`);
      return c.json({ error: "Failed to parse AI response" }, 500);
    }

    // Attach full song data to ranked results
    const enrichedResults = (mirResult.ranked_results || []).map((result: any) => {
      const fullSong = validSongs.find((s: any) => s.id === result.song_id);
      return {
        ...result,
        song: fullSong || null,
      };
    }).filter((r: any) => r.song !== null);

    console.log(`MIR search returned ${enrichedResults.length} ranked results`);

    return c.json({
      interpretation: mirResult.interpretation || "",
      feature_focus: mirResult.feature_focus || [],
      results: enrichedResults,
    });
  } catch (error) {
    console.log(`MIR search error: ${error.message}`);
    return c.json({ error: `MIR search error: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);