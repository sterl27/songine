import { useMemo, useState } from "react";
import { Loader2, Music2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  type GenerateResponse,
  getPipelineFileUrl,
  streamGenerateLocalBeat,
} from "../utils/localPipelineApi";
import { MIRVisualizer } from "./MIRVisualizer";
import { MelodyVisualizer } from "./MelodyVisualizer";

const DEFAULT_PROMPT =
  "dark cinematic trap beat 94 BPM heavy 808 triplet hats indigo haze noir atmosphere";

export function LocalPipelineStudio() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const rawUrl = useMemo(() => {
    if (!result?.raw) return "";
    return getPipelineFileUrl(result.raw);
  }, [result?.raw]);

  const onGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      await streamGenerateLocalBeat(
        { prompt: prompt.trim(), duration, instrumental: true },
        {
          onMessage: (message) => {
            setLogs((prev) => [...prev, message]);
          },
          onResult: (payload) => {
            setResult(payload);
          },
          onError: (msg) => {
            setError(msg);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline run failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="size-5 text-primary" />
            Local Music Pipeline
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            MusicGen + Demucs + MIR (fully local, no third-party generation API).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
              placeholder="Describe your track..."
              disabled={loading}
            />
          </div>

          <div className="grid sm:grid-cols-[140px_1fr] gap-3 items-end">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Duration (s)</label>
              <Input
                type="number"
                min={5}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Math.max(5, Math.min(60, Number(e.target.value || 30))))}
                disabled={loading}
              />
            </div>
            <Button
              onClick={onGenerate}
              disabled={loading || !prompt.trim()}
              className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="size-4 mr-2" />
              )}
              {loading ? "Generating..." : "Generate Beat + Stems + MIR"}
            </Button>
          </div>

          <div className="rounded-xl border border-primary/10 bg-background/40 p-3 h-44 overflow-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">Progress logs will appear here.</p>
            ) : (
              logs.map((line, idx) => (
                <div key={`log-${idx}`} className="py-0.5">
                  {line}
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-base">Generated Audio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Raw mix</p>
                <audio controls src={rawUrl} className="w-full" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(result.stems).map(([stemName, fileName]) => (
                  <div key={stemName} className="rounded-lg border border-primary/10 p-3 bg-background/30">
                    <p className="text-sm mb-2 capitalize text-primary">{stemName}</p>
                    <audio controls src={getPipelineFileUrl(fileName)} className="w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <MIRVisualizer mir={result.mir} />
          <MelodyVisualizer melody={result.mir.melody} />
        </div>
      )}
    </div>
  );
}
