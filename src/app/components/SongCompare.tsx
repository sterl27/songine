import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  GitCompare,
  Zap,
  Activity,
  Heart,
  Headphones,
  Music,
  Waves,
  Mic2,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
} from "lucide-react";
import { getAllSongs } from "../utils/api";
import type { Song } from "./SongCard";

interface SongCompareProps {
  initialSong?: Song | null;
}

function getDiffIcon(diff: number) {
  if (diff > 5) return <ArrowUpRight className="size-3.5 text-green-400" />;
  if (diff < -5) return <ArrowDownRight className="size-3.5 text-red-400" />;
  return <Equal className="size-3.5 text-muted-foreground" />;
}

const FEATURES = [
  { key: "energy", label: "Energy", icon: <Zap className="size-3.5" /> },
  { key: "danceability", label: "Danceability", icon: <Activity className="size-3.5" /> },
  { key: "valence", label: "Valence", icon: <Heart className="size-3.5" /> },
  { key: "acousticness", label: "Acousticness", icon: <Headphones className="size-3.5" /> },
  { key: "instrumentalness", label: "Instrumentalness", icon: <Music className="size-3.5" /> },
  { key: "liveness", label: "Liveness", icon: <Waves className="size-3.5" /> },
  { key: "speechiness", label: "Speechiness", icon: <Mic2 className="size-3.5" /> },
] as const;

export function SongCompare({ initialSong }: SongCompareProps) {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [songA, setSongA] = useState<Song | null>(initialSong || null);
  const [songB, setSongB] = useState<Song | null>(null);

  useEffect(() => {
    getAllSongs()
      .then((songs) => {
        setAllSongs(songs);
        if (!songA && songs.length > 0) setSongA(songs[0]);
        if (!songB && songs.length > 1) setSongB(songs[1]);
      })
      .catch((err) => console.error("Failed to load songs for comparison:", err));
  }, []);

  useEffect(() => {
    if (initialSong) setSongA(initialSong);
  }, [initialSong?.id]);

  const radarData = useMemo(() => {
    if (!songA || !songB) return [];
    return FEATURES.map((f) => ({
      feature: f.label,
      songA: Math.round((songA.analysis as any)[f.key] * 100),
      songB: Math.round((songB.analysis as any)[f.key] * 100),
      uniqueKey: `compare-radar-${f.key}`,
    }));
  }, [songA?.id, songB?.id]);

  if (allSongs.length < 2) {
    return (
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <GitCompare className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Need at least 2 songs to compare.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Song Selectors */}
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-pink-500 to-purple-500" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="size-5 text-primary" />
            Compare Songs
          </CardTitle>
          <p className="text-xs text-muted-foreground">Select two songs to see a side-by-side audio feature comparison</p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Song A</label>
              <Select
                value={songA?.id || ""}
                onValueChange={(id) => setSongA(allSongs.find((s) => s.id === id) || null)}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Select song..." />
                </SelectTrigger>
                <SelectContent>
                  {allSongs.map((s) => (
                    <SelectItem key={`sel-a-${s.id}`} value={s.id}>
                      {s.title} — {s.artist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {songA && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="size-8 rounded overflow-hidden flex-shrink-0">
                    <img src={songA.imageUrl} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{songA.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{songA.artist} &middot; {songA.analysis.tempo} BPM</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">Song B</label>
              <Select
                value={songB?.id || ""}
                onValueChange={(id) => setSongB(allSongs.find((s) => s.id === id) || null)}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Select song..." />
                </SelectTrigger>
                <SelectContent>
                  {allSongs.map((s) => (
                    <SelectItem key={`sel-b-${s.id}`} value={s.id}>
                      {s.title} — {s.artist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {songB && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-pink-500/5 border border-pink-500/10">
                  <div className="size-8 rounded overflow-hidden flex-shrink-0">
                    <img src={songB.imageUrl} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{songB.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{songB.artist} &middot; {songB.analysis.tempo} BPM</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {songA && songB && (
        <>
          {/* Radar Overlay */}
          <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Feature Overlay</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350} key={`compare-radar-${songA.id}-${songB.id}`}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="feature"
                    tick={{ fill: "#a1a1a1", fontSize: 11 }}
                    allowDuplicatedCategory={false}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: "#666", fontSize: 10 }}
                    tickCount={5}
                    allowDuplicatedCategory={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#121212",
                      border: "1px solid rgba(255,0,110,0.2)",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Radar
                    name={songA.title}
                    dataKey="songA"
                    stroke="#ff006e"
                    fill="#ff006e"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Radar
                    name={songB.title}
                    dataKey="songB"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature-by-Feature Table */}
          <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Feature-by-Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {FEATURES.map((feat) => {
                  const valA = Math.round((songA.analysis as any)[feat.key] * 100);
                  const valB = Math.round((songB.analysis as any)[feat.key] * 100);
                  const diff = valB - valA;
                  return (
                    <div key={`cmp-${feat.key}`} className="flex items-center gap-3">
                      <span className="text-primary">{feat.icon}</span>
                      <span className="text-sm w-28 flex-shrink-0 text-foreground/80">{feat.label}</span>

                      {/* Song A bar */}
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs font-bold tabular-nums w-8 text-right text-primary">{valA}%</span>
                        <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden relative">
                          <div className="absolute inset-y-0 left-0 bg-primary/70 rounded-full" style={{ width: `${valA}%` }} />
                          <div className="absolute inset-y-0 left-0 bg-sky-400/50 rounded-full" style={{ width: `${valB}%` }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums w-8 text-sky-400">{valB}%</span>
                      </div>

                      {/* Diff */}
                      <div className="flex items-center gap-1 w-14 justify-end">
                        {getDiffIcon(diff)}
                        <span className={`text-xs font-medium tabular-nums ${diff > 5 ? "text-green-400" : diff < -5 ? "text-red-400" : "text-muted-foreground"}`}>
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Tempo comparison */}
                <div className="flex items-center gap-3 pt-2 border-t border-primary/10 mt-2">
                  <span className="text-primary"><Activity className="size-3.5" /></span>
                  <span className="text-sm w-28 flex-shrink-0 text-foreground/80">Tempo</span>
                  <div className="flex-1 flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/20 text-primary">{songA.analysis.tempo} BPM</Badge>
                    <Badge variant="outline" className="border-sky-400/20 text-sky-400">{songB.analysis.tempo} BPM</Badge>
                  </div>
                  <div className="flex items-center gap-1 w-14 justify-end">
                    {getDiffIcon(songB.analysis.tempo - songA.analysis.tempo)}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {songB.analysis.tempo - songA.analysis.tempo > 0 ? "+" : ""}{songB.analysis.tempo - songA.analysis.tempo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">{songA.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-sky-400" />
                  <span className="text-xs text-muted-foreground">{songB.title}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
