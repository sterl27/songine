import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { History, Trash2, Clock, Music2 } from "lucide-react";
import type { Song } from "./SongCard";

interface SongHistoryProps {
  history: Song[];
  onSelectSong: (song: Song) => void;
  onClearHistory: () => void;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SongHistory({ history, onSelectSong, onClearHistory }: SongHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium mb-1">No History Yet</p>
          <p className="text-xs text-muted-foreground/60">Songs you analyze will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-primary" />
            Recently Analyzed ({history.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-muted-foreground hover:text-destructive text-xs"
          >
            <Trash2 className="size-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {history.map((song, idx) => (
            <button
              key={`history-${song.id}-${idx}`}
              onClick={() => onSelectSong(song)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors text-left group cursor-pointer"
            >
              <div className="size-10 rounded-md overflow-hidden flex-shrink-0 border border-primary/10 bg-muted">
                <img src={song.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {song.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{song.artist} &middot; {song.album}</p>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(song.duration)}</span>
                <span className="text-[10px] text-muted-foreground/50">{song.analysis.tempo} BPM</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
