import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import type { MirData } from "../utils/localPipelineApi";

interface MIRVisualizerProps {
  mir: MirData;
}

export function MIRVisualizer({ mir }: MIRVisualizerProps) {
  return (
    <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">MIR Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chords">Chords</TabsTrigger>
            <TabsTrigger value="energy">Energy</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5 mt-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-primary/10 p-4 bg-background/30">
                <p className="text-xs text-muted-foreground mb-1">Tempo</p>
                <p className="text-3xl font-semibold text-primary">{mir.tempo} BPM</p>
              </div>
              <div className="rounded-xl border border-primary/10 p-4 bg-background/30">
                <p className="text-xs text-muted-foreground mb-1">Key</p>
                <p className="text-3xl font-semibold text-pink-400">{mir.key}</p>
                <p className="text-xs text-muted-foreground mt-1">Confidence: {mir.key_confidence}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-primary/10 p-4 bg-background/30 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Danceability</span>
                  <span>{mir.danceability}</span>
                </div>
                <Progress value={Math.max(0, Math.min(100, mir.danceability * 100))} className="h-2" />
              </div>

              <div className="rounded-xl border border-primary/10 p-4 bg-background/30">
                <p className="text-xs text-muted-foreground mb-1">Loudness</p>
                <p className="text-2xl font-semibold">{mir.loudness} dB</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chords" className="mt-0">
            {mir.chords?.length ? (
              <div className="flex flex-wrap gap-2">
                {mir.chords.map((chord, index) => (
                  <span
                    key={`${chord}-${index}`}
                    className="px-3 py-1.5 rounded-full text-xs border border-pink-500/30 bg-pink-500/10 text-pink-300"
                  >
                    {chord}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No chord progression extracted.</p>
            )}
          </TabsContent>

          <TabsContent value="energy" className="mt-0">
            <div className="h-44 bg-background/40 border border-primary/10 rounded-xl p-3 flex items-end gap-px overflow-hidden">
              {(mir.energy_curve ?? []).slice(0, 100).map((value, index) => {
                const height = Math.max(4, Math.min(100, value * 220));
                return (
                  <div
                    key={`energy-${index}`}
                    className="w-full bg-gradient-to-t from-primary to-pink-500 rounded-sm"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-primary/10 p-3 bg-background/30">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p>{mir.duration_sec}s</p>
              </div>
              <div className="rounded-xl border border-primary/10 p-3 bg-background/30">
                <p className="text-xs text-muted-foreground">Dynamic Complexity</p>
                <p>{mir.dynamic_complexity}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
