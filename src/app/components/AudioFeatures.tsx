import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import React, { useMemo, memo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { Song } from "./SongCard";
import { Zap, Activity, Heart, Headphones, Waves, Mic2, Volume2, Music, Gauge } from "lucide-react";

interface AudioFeaturesProps {
  song: Song;
}

/** Percentile descriptor based on 0-100 value */
function getPercentileLabel(value: number): string {
  if (value >= 90) return "Very High";
  if (value >= 70) return "High";
  if (value >= 50) return "Moderate";
  if (value >= 30) return "Low";
  return "Very Low";
}

function getPercentileColor(value: number): string {
  if (value >= 80) return "text-green-400";
  if (value >= 60) return "text-pink-400";
  if (value >= 40) return "text-yellow-400";
  if (value >= 20) return "text-orange-400";
  return "text-red-400";
}

function getBarFill(value: number): string {
  if (value >= 80) return "#22c55e";
  if (value >= 60) return "#ff006e";
  if (value >= 40) return "#eab308";
  if (value >= 20) return "#f97316";
  return "#ef4444";
}

const FEATURE_META: Record<string, { icon: React.ReactNode; description: string }> = {
  Energy: { icon: <Zap className="size-3.5" />, description: "Intensity and activity level" },
  Danceability: { icon: <Activity className="size-3.5" />, description: "Suitability for dancing" },
  Valence: { icon: <Heart className="size-3.5" />, description: "Musical positiveness / happiness" },
  Acousticness: { icon: <Headphones className="size-3.5" />, description: "Acoustic instrument confidence" },
  Liveness: { icon: <Waves className="size-3.5" />, description: "Presence of a live audience" },
  Speechiness: { icon: <Mic2 className="size-3.5" />, description: "Presence of spoken words" },
  Instrumentalness: { icon: <Music className="size-3.5" />, description: "Likelihood of no vocals" },
};

/** Custom Recharts tooltip for the bar chart */
function CustomBarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const meta = FEATURE_META[data.name];
  return (
    <div className="bg-card border border-primary/20 rounded-lg px-4 py-3 shadow-xl shadow-black/40">
      <div className="flex items-center gap-2 mb-1">
        {meta?.icon}
        <span className="font-semibold text-foreground text-sm">{data.name}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{meta?.description}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-primary">{data.value.toFixed(0)}%</span>
        <span className={`text-xs font-medium ${getPercentileColor(data.value)}`}>
          {getPercentileLabel(data.value)}
        </span>
      </div>
    </div>
  );
}

/** Custom Recharts tooltip for the radar chart */
function CustomRadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-primary/20 rounded-lg px-3 py-2 shadow-xl shadow-black/40">
      <span className="font-semibold text-foreground text-sm">{data.feature}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-lg font-bold text-primary">{data.value.toFixed(0)}%</span>
        <span className={`text-xs ${getPercentileColor(data.value)}`}>
          {getPercentileLabel(data.value)}
        </span>
      </div>
    </div>
  );
}

/** Custom angle axis tick for radar chart with better readability */
function CustomAngleTick({ x, y, payload }: any) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-muted-foreground text-[11px] font-medium"
    >
      {payload.value}
    </text>
  );
}

export const AudioFeatures = memo(function AudioFeatures({ song }: AudioFeaturesProps) {
  const radarData = useMemo(
    () => [
      { feature: "Energy", value: song.analysis.energy * 100, uniqueKey: `${song.id}-radar-energy` },
      { feature: "Dance", value: song.analysis.danceability * 100, uniqueKey: `${song.id}-radar-dance` },
      { feature: "Valence", value: song.analysis.valence * 100, uniqueKey: `${song.id}-radar-valence` },
      { feature: "Acoustic", value: song.analysis.acousticness * 100, uniqueKey: `${song.id}-radar-acoustic` },
      { feature: "Liveness", value: song.analysis.liveness * 100, uniqueKey: `${song.id}-radar-live` },
      { feature: "Speech", value: song.analysis.speechiness * 100, uniqueKey: `${song.id}-radar-speech` },
    ],
    [song.id, song.analysis.energy, song.analysis.danceability, song.analysis.valence, song.analysis.acousticness, song.analysis.liveness, song.analysis.speechiness]
  );

  const barData = useMemo(
    () => [
      { name: "Energy", value: song.analysis.energy * 100, uniqueKey: `${song.id}-bar-energy` },
      { name: "Danceability", value: song.analysis.danceability * 100, uniqueKey: `${song.id}-bar-dance` },
      { name: "Valence", value: song.analysis.valence * 100, uniqueKey: `${song.id}-bar-valence` },
      { name: "Acousticness", value: song.analysis.acousticness * 100, uniqueKey: `${song.id}-bar-acoustic` },
      { name: "Instrumentalness", value: song.analysis.instrumentalness * 100, uniqueKey: `${song.id}-bar-inst` },
      { name: "Liveness", value: song.analysis.liveness * 100, uniqueKey: `${song.id}-bar-live` },
      { name: "Speechiness", value: song.analysis.speechiness * 100, uniqueKey: `${song.id}-bar-speech` },
    ],
    [song.id, song.analysis.energy, song.analysis.danceability, song.analysis.valence, song.analysis.acousticness, song.analysis.instrumentalness, song.analysis.liveness, song.analysis.speechiness]
  );

  const radiusTicks = useMemo(() => [0, 25, 50, 75, 100], []);

  /** Feature detail bars for inline display */
  const featureDetails = useMemo(
    () => [
      { key: "energy", label: "Energy", value: song.analysis.energy * 100, icon: <Zap className="size-4 text-primary" /> },
      { key: "danceability", label: "Danceability", value: song.analysis.danceability * 100, icon: <Activity className="size-4 text-primary" /> },
      { key: "valence", label: "Valence", value: song.analysis.valence * 100, icon: <Heart className="size-4 text-primary" /> },
      { key: "acousticness", label: "Acousticness", value: song.analysis.acousticness * 100, icon: <Headphones className="size-4 text-primary" /> },
      { key: "instrumentalness", label: "Instrumentalness", value: song.analysis.instrumentalness * 100, icon: <Music className="size-4 text-primary" /> },
      { key: "liveness", label: "Liveness", value: song.analysis.liveness * 100, icon: <Waves className="size-4 text-primary" /> },
      { key: "speechiness", label: "Speechiness", value: song.analysis.speechiness * 100, icon: <Mic2 className="size-4 text-primary" /> },
    ],
    [song.id, song.analysis]
  );

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Audio Fingerprint</CardTitle>
            <p className="text-xs text-muted-foreground">Multi-dimensional audio profile</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key={`radar-rc-${song.id}`}>
              <RadarChart data={radarData} key={`radar-chart-${song.id}`}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                <PolarAngleAxis
                  dataKey="feature"
                  tick={<CustomAngleTick />}
                  allowDuplicatedCategory={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#666", fontSize: 10 }}
                  tickCount={5}
                  allowDuplicatedCategory={false}
                />
                <Tooltip content={<CustomRadarTooltip />} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#ff006e"
                  fill="#ff006e"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={{ r: 4, fill: "#ff006e", stroke: "#fff", strokeWidth: 1 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feature Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Individual audio feature scores</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key={`bar-rc-${song.id}`}>
              <BarChart data={barData} key={`bar-chart-${song.id}`}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#a1a1a1", fontSize: 11 }}
                  allowDuplicatedCategory={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#666", fontSize: 11 }}
                  ticks={radiusTicks}
                  allowDuplicatedCategory={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {barData.map((entry) => (
                    <Cell key={entry.uniqueKey} fill={getBarFill(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Detail Bars */}
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Feature Details</CardTitle>
          <p className="text-xs text-muted-foreground">Detailed breakdown with percentile indicators</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featureDetails.map((feat) => (
              <div key={`feat-detail-${song.id}-${feat.key}`} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {feat.icon}
                    <span className="text-sm font-medium text-foreground">{feat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getPercentileColor(feat.value)}`}>
                      {getPercentileLabel(feat.value)}
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums w-12 text-right">
                      {feat.value.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(feat.value, 1)}%`,
                      background: `linear-gradient(90deg, ${getBarFill(feat.value)}88, ${getBarFill(feat.value)})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1.5">
                <Volume2 className="size-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loudness</p>
              </div>
              <p className="text-2xl font-semibold text-primary tabular-nums">
                {song.analysis.loudness.toFixed(1)} <span className="text-sm text-muted-foreground">dB</span>
              </p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1.5">
                <Gauge className="size-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Tempo</p>
              </div>
              <p className="text-2xl font-semibold text-primary tabular-nums">
                {song.analysis.tempo} <span className="text-sm text-muted-foreground">BPM</span>
              </p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">Time Signature</p>
              <p className="text-2xl font-semibold text-primary">
                {song.analysis.timeSignature}
              </p>
            </div>
            <div className="space-y-1 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">Key &amp; Mode</p>
              <p className="text-2xl font-semibold text-primary">
                {song.analysis.key} <span className="text-sm text-muted-foreground">{song.analysis.mode}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});