import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Brain,
  Sparkles,
  Music,
  Disc3,
  Users,
  Lightbulb,
  RefreshCw,
  Loader2,
  Cpu,
} from "lucide-react";
import type { Song } from "./SongCard";
import { getAIAnalysis, type AISource } from "../utils/api";
import type { AIAnalysis } from "../utils/api";

interface AIInsightsProps {
  song: Song;
}

async function isLocalAgentAvailable(): Promise<boolean> {
  try {
    const r = await fetch("/api/agent/health", { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return false;
    const data = await r.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

export function AIInsights({ song }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSongId, setLastSongId] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<AISource | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [localAvailable, setLocalAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    isLocalAgentAvailable().then(setLocalAvailable);
  }, []);

  // Auto-fetch when song changes
  useEffect(() => {
    if (song.id !== lastSongId) {
      setAnalysis(null);
      setError(null);
    }
  }, [song.id, lastSongId]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAiSource(null);
    setAiModel(null);
    try {
      const { analysis: result, source, model } = await getAIAnalysis(song);
      setAiSource(source);
      setAiModel(model ?? null);
      setAnalysis(result);
      setLastSongId(song.id);
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to get AI analysis"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!analysis && !isLoading && !error) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="size-16 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
            <Brain className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-3">
            Get deep analysis of "{song.title}". Discover mood, genre hints,
            production notes, DJ tips, and more.
          </p>
          {localAvailable !== null && (
            <div className="flex items-center gap-1.5 mb-4 text-xs">
              <Cpu className={`size-3.5 ${localAvailable ? "text-green-500" : "text-muted-foreground"}`} />
              <span className={localAvailable ? "text-green-500" : "text-muted-foreground"}>
                {localAvailable ? "Hermes3 (local)" : "Cloud AI"}
              </span>
            </div>
          )}
          <Button
            onClick={handleAnalyze}
            className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg shadow-primary/20"
          >
            <Sparkles className="size-4 mr-2" />
            Generate AI Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">
            {localAvailable ? "Hermes3" : "AI"} is analyzing "{song.title}"...
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            This may take a few seconds
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="size-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Brain className="size-6 text-destructive" />
          </div>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={handleAnalyze}>
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Mood & Summary */}
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-pink-500 to-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-5 text-primary" />
              AI Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {analysis.mood}
              </Badge>
              {aiSource === "local" && (
                <Badge variant="outline" className="border-green-500/30 text-green-500 text-xs gap-1">
                  <Cpu className="size-3" /> Hermes3
                </Badge>
              )}
              {aiSource === "openrouter" && (
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs gap-1">
                  <Cpu className="size-3" /> {aiModel ? `OpenRouter · ${aiModel}` : "OpenRouter"}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="text-muted-foreground hover:text-primary"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Genre Hints */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="size-4 text-primary" />
              Genre Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.genre_hints.map((genre, index) => (
                <Badge
                  key={`genre-${index}`}
                  variant="outline"
                  className="border-primary/20 text-foreground/80"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Similar Artists */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Similar Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.similar_artists.map((artist, index) => (
                <Badge
                  key={`artist-${index}`}
                  variant="secondary"
                  className="bg-secondary/50"
                >
                  {artist}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Production Notes */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Disc3 className="size-4 text-primary" />
              Production Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {analysis.production_notes}
            </p>
          </CardContent>
        </Card>

        {/* DJ Tips */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              DJ Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {analysis.dj_tips}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fun Fact */}
      {analysis.fun_fact && (
        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-pink-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Lightbulb className="size-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">
                  Fun Fact
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {analysis.fun_fact}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
