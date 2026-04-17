import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Music, Clock, Disc, Activity, Heart, Info } from "lucide-react";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  releaseYear: number;
  imageUrl: string;
  analysis: {
    tempo: number;
    key: string;
    mode: string;
    timeSignature: string;
    energy: number;
    danceability: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    loudness: number;
  };
}

interface SongCardProps {
  song: Song;
  isFavorite?: boolean;
  onToggleFavorite?: (song: Song) => void;
  onShowDetails?: (song: Song) => void;
  compact?: boolean;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const SongCard = memo(function SongCard({
  song,
  isFavorite,
  onToggleFavorite,
  onShowDetails,
  compact = false,
}: SongCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/5 hover:border-primary/15 transition-all group">
        <div className="size-10 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-pink-500/20 border border-primary/10">
          <img
            src={song.imageUrl}
            alt={`${song.title} album art`}
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {song.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(song.duration)}</span>
      </div>
    );
  }

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          <div className="size-24 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-lg overflow-hidden flex-shrink-0 border border-primary/20 shadow-md shadow-black/20">
            <img
              src={song.imageUrl}
              alt={`${song.title} album art`}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="truncate text-foreground text-lg">{song.title}</CardTitle>
                <p className="text-primary truncate font-medium">{song.artist}</p>
                <p className="text-sm text-muted-foreground truncate">{song.album}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(song);
                    }}
                    className={`size-8 p-0 ${isFavorite ? "text-pink-500 hover:text-pink-400" : "text-muted-foreground hover:text-primary"}`}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                )}
                {onShowDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowDetails(song);
                    }}
                    className="size-8 p-0 text-muted-foreground hover:text-primary"
                    title="Song details"
                  >
                    <Info className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium tabular-nums">{formatDuration(song.duration)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tempo</p>
              <p className="font-medium tabular-nums">{song.analysis.tempo} BPM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Music className="size-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Key</p>
              <p className="font-medium">
                {song.analysis.key} {song.analysis.mode}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Disc className="size-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Released</p>
              <p className="font-medium tabular-nums">{song.releaseYear}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
