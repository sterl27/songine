import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Search,
  Brain,
  Loader2,
  Zap,
  Target,
  ChevronRight,
  Waves,
  Activity,
  Music,
  Gauge,
  Headphones,
  Mic2,
  Volume2,
  Heart,
  Sparkles,
} from "lucide-react";
import { mirSearch } from "../utils/api";
import type { MIRSearchResult, MIRSearchResponse } from "../utils/api";
import type { Song } from "./SongCard";

interface MIRSearchProps {
  onSelectSong: (song: Song) => void;
}

const EXAMPLE_QUERIES = [
  "upbeat songs for a party",
  "calm and acoustic vibes",
  "high energy workout music",
  "melancholic and emotional",
  "songs that feel like summer",
  "fast tempo dance tracks",
];

const featureIcons: Record<string, React.ReactNode> = {
  energy: <Zap className="size-3" />,
  danceability: <Activity className="size-3" />,
  valence: <Heart className="size-3" />,
  acousticness: <Headphones className="size-3" />,
  tempo: <Gauge className="size-3" />,
  instrumentalness: <Music className="size-3" />,
  liveness: <Waves className="size-3" />,
  speechiness: <Mic2 className="size-3" />,
  loudness: <Volume2 className="size-3" />,
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Perfect Match";
  if (score >= 75) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Partial Match";
  return "Weak Match";
}

export function MIRSearch({ onSelectSong }: MIRSearchProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] =
    useState<MIRSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResponse(null);

    try {
      const response = await mirSearch(q);
      setSearchResponse(response);
    } catch (err) {
      console.error("MIR Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSearch(example);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-pink-500 to-purple-500" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="size-8 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-lg flex items-center justify-center">
              <Brain className="size-4 text-primary" />
            </div>
            AI MIR Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search your music library using natural language. Describe moods,
            activities, vibes, or musical characteristics.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "upbeat dance tracks" or "something melancholic"...'
                className="pl-10 bg-background/50 border-primary/20 focus-visible:ring-primary focus-visible:border-primary"
                disabled={isSearching}
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg shadow-primary/20"
            >
              {isSearching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              <span className="ml-2 hidden sm:inline">
                {isSearching ? "Searching..." : "MIR Search"}
              </span>
            </Button>
          </form>

          {/* Example Queries */}
          {!searchResponse && !isSearching && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                Try these
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <button
                    key={example}
                    onClick={() => handleExampleClick(example)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/15 bg-primary/5 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all cursor-pointer"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isSearching && (
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="size-16 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full flex items-center justify-center">
                <Brain className="size-8 text-primary" />
              </div>
              <div className="absolute inset-0 size-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
            <p className="text-foreground font-medium mb-1">
              Analyzing your query...
            </p>
            <p className="text-sm text-muted-foreground">
              Grok is matching audio features to your description
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/20 bg-gradient-to-br from-card to-card/50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">
                  Search Failed
                </p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchResponse && (
        <div className="space-y-4">
          {/* AI Interpretation */}
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-pink-500/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Target className="size-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">
                      AI Interpretation
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {searchResponse.interpretation}
                    </p>
                  </div>
                  {searchResponse.feature_focus.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {searchResponse.feature_focus.map((feature, index) => (
                        <Badge
                          key={`focus-${index}`}
                          variant="outline"
                          className="border-primary/20 text-primary text-[10px] px-2 py-0.5"
                        >
                          {featureIcons[feature.toLowerCase()] || (
                            <Zap className="size-3" />
                          )}
                          <span className="ml-1 capitalize">{feature}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranked Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Ranked Results ({searchResponse.results.length})
              </h3>
            </div>

            {searchResponse.results.map(
              (result: MIRSearchResult, index: number) => (
                <Card
                  key={`mir-${result.song_id}`}
                  className="border-primary/10 bg-gradient-to-br from-card to-card/50 hover:border-primary/25 transition-all cursor-pointer group"
                  onClick={() => onSelectSong(result.song)}
                >
                  <CardContent className="py-4 px-4 sm:px-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Rank Badge */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-gradient-to-br from-primary to-pink-500 text-white"
                              : index === 1
                                ? "bg-primary/20 text-primary"
                                : index === 2
                                  ? "bg-primary/10 text-primary/70"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Album Art */}
                      <div className="size-14 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-lg overflow-hidden flex-shrink-0 border border-primary/10">
                        <img
                          src={result.song.imageUrl}
                          alt={result.song.title}
                          className="size-full object-cover"
                        />
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {result.song.title}
                            </p>
                            <p className="text-sm text-primary/80 truncate">
                              {result.song.artist}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.song.album} ({result.song.releaseYear})
                            </p>
                          </div>

                          {/* Relevance Score */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span
                              className={`text-xl font-bold ${getScoreColor(result.relevance_score)}`}
                            >
                              {result.relevance_score}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {getScoreLabel(result.relevance_score)}
                            </span>
                          </div>
                        </div>

                        {/* Relevance Bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getScoreBarColor(result.relevance_score)}`}
                              style={{
                                width: `${result.relevance_score}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Reason */}
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {result.reason}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}