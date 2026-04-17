import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Clock,
  Music,
  Activity,
  Disc,
  Volume2,
  Zap,
  Heart,
  Headphones,
  Waves,
  Mic2,
  Gauge,
} from "lucide-react";
import type { Song } from "./SongCard";

interface SongDetailModalProps {
  song: Song | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getLabel(value: number): string {
  if (value >= 90) return "Very High";
  if (value >= 70) return "High";
  if (value >= 50) return "Moderate";
  if (value >= 30) return "Low";
  return "Very Low";
}

function getLabelColor(value: number): string {
  if (value >= 80) return "bg-green-500/10 text-green-400 border-green-500/20";
  if (value >= 60) return "bg-pink-500/10 text-pink-400 border-pink-500/20";
  if (value >= 40) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (value >= 20) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

const featureRows = (song: Song) => [
  { icon: <Zap className="size-4" />, label: "Energy", value: song.analysis.energy },
  { icon: <Activity className="size-4" />, label: "Danceability", value: song.analysis.danceability },
  { icon: <Heart className="size-4" />, label: "Valence", value: song.analysis.valence },
  { icon: <Headphones className="size-4" />, label: "Acousticness", value: song.analysis.acousticness },
  { icon: <Music className="size-4" />, label: "Instrumentalness", value: song.analysis.instrumentalness },
  { icon: <Waves className="size-4" />, label: "Liveness", value: song.analysis.liveness },
  { icon: <Mic2 className="size-4" />, label: "Speechiness", value: song.analysis.speechiness },
];

export function SongDetailModal({ song, open, onOpenChange }: SongDetailModalProps) {
  if (!song) return null;

  const pct = (v: number) => Math.round(v * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-primary/15 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex gap-4 items-start">
            <div className="size-20 rounded-lg overflow-hidden flex-shrink-0 border border-primary/20 shadow-md">
              <img
                src={song.imageUrl}
                alt={`${song.title} album art`}
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl truncate">{song.title}</DialogTitle>
              <DialogDescription className="text-primary font-medium text-base">
                {song.artist}
              </DialogDescription>
              <p className="text-sm text-muted-foreground">{song.album} ({song.releaseYear})</p>
            </div>
          </div>
        </DialogHeader>

        {/* Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Clock className="size-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
              <p className="text-sm font-semibold tabular-nums">{formatDuration(song.duration)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Gauge className="size-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Tempo</p>
              <p className="text-sm font-semibold tabular-nums">{song.analysis.tempo} BPM</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Music className="size-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Key</p>
              <p className="text-sm font-semibold">{song.analysis.key} {song.analysis.mode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <Volume2 className="size-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Loudness</p>
              <p className="text-sm font-semibold tabular-nums">{song.analysis.loudness.toFixed(1)} dB</p>
            </div>
          </div>
        </div>

        {/* Audio Features */}
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audio Features</h4>
          <div className="space-y-2.5">
            {featureRows(song).map((feat) => {
              const val = pct(feat.value);
              return (
                <div key={feat.label} className="flex items-center gap-3">
                  <span className="text-primary">{feat.icon}</span>
                  <span className="text-sm text-foreground w-32 flex-shrink-0">{feat.label}</span>
                  <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(val, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums w-10 text-right">{val}%</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getLabelColor(val)}`}>
                    {getLabel(val)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Signature */}
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Disc className="size-4 text-primary" />
          <span>Time Signature: <strong className="text-foreground">{song.analysis.timeSignature}</strong></span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
