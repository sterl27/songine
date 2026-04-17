import type { MelodyData } from "../utils/localPipelineApi";

interface MelodyVisualizerProps {
  melody: MelodyData;
}

export function MelodyVisualizer({ melody }: MelodyVisualizerProps) {
  if (!melody?.contour?.length) {
    return (
      <div className="rounded-xl border border-primary/10 bg-background/30 p-4 text-sm text-muted-foreground">
        Melody contour unavailable for this generation.
      </div>
    );
  }

  const { contour, confidence = [] } = melody;
  const validContour = contour.filter((value) => value > 0);

  const minPitch = validContour.length ? Math.min(...validContour) : 0;
  const maxPitch = validContour.length ? Math.max(...validContour) : 1;

  const averageConfidence =
    confidence.length > 0
      ? confidence.reduce((sum, value) => sum + value, 0) / confidence.length
      : 0;

  const points = contour
    .map((pitch, index) => {
      const x = (index / Math.max(1, contour.length - 1)) * 400;
      const normalized = maxPitch === minPitch ? 0.5 : (pitch - minPitch) / (maxPitch - minPitch);
      const y = 100 - normalized * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-primary/10 bg-background/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Melody Contour</p>
          <p className="text-xs text-muted-foreground">
            {melody.min_pitch}Hz → {melody.max_pitch}Hz (range {melody.pitch_range}Hz)
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Avg confidence: {(averageConfidence * 100).toFixed(1)}%
        </p>
      </div>

      <div className="h-52 rounded-lg border border-primary/10 bg-black/30 overflow-hidden">
        <svg viewBox="0 0 400 100" className="w-full h-full">
          <polyline
            points={points}
            fill="none"
            stroke="#d946ef"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {contour.map((pitch, index) => {
            const x = (index / Math.max(1, contour.length - 1)) * 400;
            const normalized = maxPitch === minPitch ? 0.5 : (pitch - minPitch) / (maxPitch - minPitch);
            const y = 100 - normalized * 100;
            const conf = confidence[index] ?? 0;
            const radius = 0.7 + conf * 1.8;
            return (
              <circle
                key={`mel-${index}`}
                cx={x}
                cy={y}
                r={radius}
                fill="#c084fc"
                fillOpacity={Math.max(0.2, conf)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
