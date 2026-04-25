import { useState, useEffect, useCallback } from "react";
import { SongSearch } from "./components/SongSearch";
import { SongCard } from "./components/SongCard";
import { AudioFeatures } from "./components/AudioFeatures";
import { AIInsights } from "./components/AIInsights";
import { MIRSearch } from "./components/MIRSearch";
import { LocalPipelineStudio } from "./components/LocalPipelineStudio";
import { AuthControls } from "./components/AuthControls";
import { SongCompare } from "./components/SongCompare";
import { SongHistory } from "./components/SongHistory";
import { SongDetailModal } from "./components/SongDetailModal";
import { ThemeSignalMap } from "./components/ThemeSignalMap";
import { SongCardSkeleton } from "./components/LoadingSkeletons";
import {
  searchSongs,
  getRandomSong,
  initializeDatabase,
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite as checkFavorite,
  getHistory,
  addToHistory,
  clearHistory as clearHistoryStorage,
} from "./utils/api";
import type { Song } from "./components/SongCard";
import {
  Music2,
  TrendingUp,
  Sparkles,
  Brain,
  Search,
  WandSparkles,
  GitCompare,
  Heart,
  History,
  Loader2,
  Target,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import type { Session } from "@supabase/supabase-js";
import {
  getSupabaseSession,
  subscribeToSupabaseAuth,
} from "./utils/supabaseAuth";

export default function App() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("mir");
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Favorites & History state
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);

  // Detail modal
  const [detailSong, setDetailSong] = useState<Song | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Load favorites & history from localStorage
  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(getHistory());
  }, []);

  // Initialize the database on first load
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        console.log("Initializing database...");
        const result = await initializeDatabase();
        console.log(`Database initialized with ${result.count} songs`);
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error("Error initializing database:", err);
        if (isMounted) {
          setError(
            `Failed to initialize database: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { session, error: sessionError } = await getSupabaseSession();
      if (!isMounted) return;

      if (sessionError) {
        console.warn("Supabase session check failed:", sessionError);
      }

      setAuthSession(session);
      setAuthReady(true);
    })();

    const unsubscribe = subscribeToSupabaseAuth((_event, session) => {
      setAuthSession(session);
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Track song in history when currentSong changes
  useEffect(() => {
    if (currentSong) {
      setHistory(addToHistory(currentSong));
    }
  }, [currentSong?.id]);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchSongs(query);
      setSearchResults(results);
      if (results.length > 0) {
        setCurrentSong(results[0]);
        setActiveTab("analysis");
      } else {
        setCurrentSong(null);
      }
    } catch (err) {
      console.error("Error searching songs:", err);
      setError(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQuickSelect = useCallback((song: Song) => {
    setCurrentSong(song);
    setSearchResults([song]);
    setActiveTab("analysis");
  }, []);

  const handleRandomSong = useCallback(async () => {
    setError(null);
    try {
      const randomSong = await getRandomSong();
      setCurrentSong(randomSong);
      setSearchResults([randomSong]);
      setActiveTab("analysis");
    } catch (err) {
      console.error("Error fetching random song:", err);
      setError(`Failed to get random song: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleMIRSelectSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setSearchResults([song]);
    setActiveTab("analysis");
  }, []);

  const handleToggleFavorite = useCallback((song: Song) => {
    if (checkFavorite(song.id)) {
      setFavorites(removeFavorite(song.id));
    } else {
      setFavorites(addFavorite(song));
    }
  }, []);

  const handleShowDetails = useCallback((song: Song) => {
    setDetailSong(song);
    setDetailOpen(true);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory(clearHistoryStorage());
  }, []);

  const handleHistorySelect = useCallback((song: Song) => {
    setCurrentSong(song);
    setSearchResults([song]);
    setActiveTab("analysis");
  }, []);

  // Show loading state during initialization
  if (!isInitialized && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 bg-gradient-to-br from-primary to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto mb-4">
            <Loader2 className="size-8 text-white animate-spin" />
          </div>
          <p className="text-foreground font-medium mb-1">Initializing Musaix Pro</p>
          <p className="text-sm text-muted-foreground">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-gradient-to-br from-primary to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Music2 className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent leading-tight">
                  Musaix Pro
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI-powered music analysis
                </p>
              </div>
            </div>

            {/* Quick Stats + Auth */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                {favorites.length > 0 && (
                  <Badge
                    variant="outline"
                    className="border-pink-500/20 text-pink-400 cursor-pointer hover:bg-pink-500/10"
                    onClick={() => setActiveTab("favorites")}
                  >
                    <Heart className="size-3 mr-1 fill-current" />
                    {favorites.length}
                  </Badge>
                )}
                {history.length > 0 && (
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-muted-foreground cursor-pointer hover:bg-primary/10"
                    onClick={() => setActiveTab("history")}
                  >
                    <History className="size-3 mr-1" />
                    {history.length}
                  </Badge>
                )}
              </div>
              <AuthControls session={authSession} isReady={authReady} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <SongSearch
              onSearch={handleSearch}
              onQuickSelect={handleQuickSelect}
              isLoading={isLoading}
            />
            <Button
              variant="outline"
              onClick={handleRandomSong}
              className="w-full sm:w-auto border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <Sparkles className="size-4 mr-2" />
              Random
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 sm:grid sm:w-full sm:max-w-4xl sm:grid-cols-9 mb-6">
              <TabsTrigger value="mir" className="text-xs sm:text-sm">
                <Search className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">AI MIR</span>
                <span className="sm:hidden">MIR</span>
              </TabsTrigger>
              <TabsTrigger value="studio" className="text-xs sm:text-sm">
                <WandSparkles className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">Local Pipeline</span>
                <span className="sm:hidden">Studio</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" disabled={!currentSong} className="text-xs sm:text-sm">
                <TrendingUp className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">Analysis</span>
                <span className="sm:hidden">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="ai" disabled={!currentSong} className="text-xs sm:text-sm">
                <Brain className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">AI Insights</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs sm:text-sm">
                <GitCompare className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">Compare</span>
                <span className="sm:hidden">Vs</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs sm:text-sm">
                <Music2 className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">Results</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs sm:text-sm">
                <Heart className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">Saved</span>
                <span className="sm:hidden">Fav</span>
                {favorites.length > 0 && (
                  <Badge variant="secondary" className="ml-1 size-5 p-0 text-[10px] items-center justify-center hidden sm:flex">
                    {favorites.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm">
                <History className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">History</span>
                <span className="sm:hidden">Hist</span>
              </TabsTrigger>
              <TabsTrigger value="themes" className="text-xs sm:text-sm">
                <Target className="size-3.5 sm:size-4 mr-1.5" />
                <span className="hidden sm:inline">Theme Map</span>
                <span className="sm:hidden">Themes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* AI MIR Search */}
          <TabsContent value="mir" className="mt-0">
            <MIRSearch onSelectSong={handleMIRSelectSong} />
          </TabsContent>

          {/* Local Generation Studio */}
          <TabsContent value="studio" className="mt-0">
            <LocalPipelineStudio />
          </TabsContent>

          {/* Audio Analysis */}
          <TabsContent value="analysis" className="mt-0">
            {isLoading ? (
              <SongCardSkeleton />
            ) : currentSong ? (
              <div className="space-y-6">
                <SongCard
                  song={currentSong}
                  isFavorite={checkFavorite(currentSong.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onShowDetails={handleShowDetails}
                />
                <AudioFeatures song={currentSong} />
              </div>
            ) : (
              <EmptyState
                icon={<Music2 className="size-10 text-muted-foreground" />}
                title="No Song Selected"
                description="Search for a song or use AI MIR Search to find music by describing what you're looking for."
                action={
                  <Button onClick={handleRandomSong}>
                    <Sparkles className="size-4 mr-2" />
                    Try a Random Song
                  </Button>
                }
              />
            )}
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="ai" className="mt-0">
            {currentSong ? (
              <div className="space-y-6">
                <SongCard
                  song={currentSong}
                  isFavorite={checkFavorite(currentSong.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onShowDetails={handleShowDetails}
                />
                <AIInsights song={currentSong} />
              </div>
            ) : (
              <EmptyState
                icon={<Brain className="size-10 text-muted-foreground" />}
                title="No Song Selected"
                description="Select a song first to generate AI-powered insights."
              />
            )}
          </TabsContent>

          {/* Compare */}
          <TabsContent value="compare" className="mt-0">
            <SongCompare initialSong={currentSong} />
          </TabsContent>

          {/* Search Results */}
          <TabsContent value="results" className="mt-0">
            {searchResults.length > 0 ? (
              <div className="grid gap-4">
                {searchResults.map((song) => (
                  <div
                    key={`result-${song.id}`}
                    onClick={() => {
                      setCurrentSong(song);
                      setActiveTab("analysis");
                    }}
                    className="cursor-pointer hover:opacity-90 transition-all"
                  >
                    <SongCard
                      song={song}
                      isFavorite={checkFavorite(song.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onShowDetails={handleShowDetails}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Music2 className="size-10 text-muted-foreground" />}
                title="No Search Results"
                description="Try searching for a song or use AI MIR Search to discover music."
              />
            )}
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites" className="mt-0">
            {favorites.length > 0 ? (
              <div className="grid gap-4">
                {favorites.map((song) => (
                  <div
                    key={`fav-${song.id}`}
                    onClick={() => {
                      setCurrentSong(song);
                      setActiveTab("analysis");
                    }}
                    className="cursor-pointer hover:opacity-90 transition-all"
                  >
                    <SongCard
                      song={song}
                      isFavorite={true}
                      onToggleFavorite={handleToggleFavorite}
                      onShowDetails={handleShowDetails}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Heart className="size-10 text-muted-foreground" />}
                title="No Saved Songs"
                description='Click the heart icon on any song card to save it to your favorites.'
              />
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-0">
            <SongHistory
              history={history}
              onSelectSong={handleHistorySelect}
              onClearHistory={handleClearHistory}
            />
          </TabsContent>

          {/* Theme Signal Map */}
          <TabsContent value="themes" className="mt-0">
            <div className="bg-slate-950 rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  <Target className="text-amber-500" />
                  Theme Signal Map
                </h2>
                <p className="text-slate-400 mt-1 text-sm">Cross-document thematic synthesis via SterlAI corpus.</p>
              </div>
              <ThemeSignalMap />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Song Detail Modal */}
      <SongDetailModal
        song={detailSong}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

/** Reusable empty state component */
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h2 className="text-xl mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}
