import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getAllSongs } from "../utils/api";
import type { Song } from "./SongCard";

interface SongSearchProps {
  onSearch: (query: string) => void;
  onQuickSelect?: (song: Song) => void;
  isLoading?: boolean;
}

/** Simple fuzzy check: all query chars appear in order inside target */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function SongSearch({ onSearch, onQuickSelect, isLoading }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all songs for suggestions on mount
  useEffect(() => {
    getAllSongs()
      .then(setAllSongs)
      .catch((err) => console.error("Failed to load songs for suggestions:", err));
  }, []);

  // Keyboard shortcut: Ctrl+/ or Cmd+/ to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced suggestion filtering
  const updateSuggestions = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        const q = value.toLowerCase();
        const matched = allSongs.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            s.album.toLowerCase().includes(q) ||
            fuzzyMatch(q, s.title) ||
            fuzzyMatch(q, s.artist)
        );
        setSuggestions(matched.slice(0, 5));
        setShowSuggestions(matched.length > 0);
        setSelectedIdx(-1);
      }, 200);
    },
    [allSongs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    updateSuggestions(val);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (song: Song) => {
    setQuery(song.title);
    setShowSuggestions(false);
    if (onQuickSelect) {
      onQuickSelect(song);
    } else {
      onSearch(song.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl" ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-primary" />
          <Input
            ref={inputRef}
            name="search"
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search songs, artists, albums... (Ctrl+/)"
            className="pl-10 pr-8 bg-card border-primary/20 focus-visible:ring-primary focus-visible:border-primary"
            disabled={isLoading}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-primary/20 rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden">
              {suggestions.map((song, idx) => (
                <button
                  key={`suggestion-${song.id}`}
                  type="button"
                  onClick={() => handleSuggestionClick(song)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    idx === selectedIdx
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <div className="size-8 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <img src={song.imageUrl} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {song.artist} &middot; {song.album}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                    {song.analysis.tempo} BPM
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg shadow-primary/20"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          <span className="ml-2 hidden sm:inline">{isLoading ? "Searching..." : "Search"}</span>
        </Button>
      </div>
    </form>
  );
}
