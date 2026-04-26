/**
 * POLANITAS — Legacy Eye Tracking Functions
 * Kept for future optional enhancement (Validasi Visual step).
 * These are NOT part of the core 3-agent pipeline anymore.
 */

import { analystChat } from "@/lib/groq-client";
import { AttentionReport, Fixation, GazePoint } from "@/types";

export function classifyQuadrant(
  x: number, y: number, viewportW: number, viewportH: number
): Fixation["quadrant"] {
  const isLeft = x < viewportW / 2;
  const isTop  = y < viewportH / 2;
  if (isTop  &&  isLeft) return "top-left";
  if (isTop  && !isLeft) return "top-right";
  if (!isTop &&  isLeft) return "bottom-left";
  return "bottom-right";
}

export function extractFixations(gazePoints: GazePoint[]): Fixation[] {
  if (gazePoints.length < 2) return [];
  const fixations: Fixation[] = [];
  const VELOCITY_THRESHOLD = 50;
  const MIN_FIXATION_DURATION = 100;
  let clusterStart = 0;

  for (let i = 1; i < gazePoints.length; i++) {
    const prev = gazePoints[i - 1];
    const curr = gazePoints[i];
    const dt   = (curr.timestamp - prev.timestamp) / 1000;
    if (dt === 0) continue;
    const dx       = curr.x - prev.x;
    const dy       = curr.y - prev.y;
    const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
    const isLast   = i === gazePoints.length - 1;

    if (velocity > VELOCITY_THRESHOLD || isLast) {
      const cluster  = gazePoints.slice(clusterStart, i);
      const duration = gazePoints[i - 1].timestamp - gazePoints[clusterStart].timestamp;
      if (cluster.length > 0 && duration >= MIN_FIXATION_DURATION) {
        const avgX = cluster.reduce((s, p) => s + p.x, 0) / cluster.length;
        const avgY = cluster.reduce((s, p) => s + p.y, 0) / cluster.length;
        const vp   = cluster[0].viewport;
        fixations.push({ x: Math.round(avgX), y: Math.round(avgY), duration, quadrant: classifyQuadrant(avgX, avgY, vp.w, vp.h) });
      }
      clusterStart = i;
    }
  }
  return fixations;
}

export function buildHeatmapData(gazePoints: GazePoint[]): Array<{ x: number; y: number; value: number }> {
  const grid    = new Map<string, number>();
  const CELL    = 40;
  for (const p of gazePoints) {
    const gx  = Math.floor(p.x / CELL) * CELL;
    const gy  = Math.floor(p.y / CELL) * CELL;
    const key = `${gx},${gy}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }
  const maxVal = Math.max(...grid.values(), 1);
  return Array.from(grid.entries()).map(([key, count]) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y, value: count / maxVal };
  });
}

const LEGACY_ANALYST_PROMPT = `
Kamu adalah analis UX dan neuromarketing. Berikan rekomendasi berdasarkan data eye-tracking.
Format output: JSON array berisi string rekomendasi dalam Bahasa Indonesia.
`;

export async function generateAttentionRecommendations(
  fixations: Fixation[],
  heatmapData: Array<{ x: number; y: number; value: number }>,
  scriptContent: string
): Promise<string[]> {
  const qc = { "top-left": 0, "top-right": 0, "bottom-left": 0, "bottom-right": 0 };
  for (const f of fixations) qc[f.quadrant]++;
  const totalDuration = fixations.reduce((s, f) => s + f.duration, 0);
  const topHeatspots  = [...heatmapData].sort((a, b) => b.value - a.value).slice(0, 5);

  const userMessage = `
Distribusi Fiksasi: KiriAtas=${qc["top-left"]} KananAtas=${qc["top-right"]} KiriBawah=${qc["bottom-left"]} KananBawah=${qc["bottom-right"]}
Total durasi perhatian: ${(totalDuration / 1000).toFixed(1)} detik
Total fiksasi: ${fixations.length}
Area paling banyak diperhatikan: ${topHeatspots.map(h => `(${h.x},${h.y}) ${(h.value * 100).toFixed(0)}%`).join(", ")}
Konten: "${scriptContent.substring(0, 500)}"
Berikan 3-5 rekomendasi. Return HANYA JSON array:
["rekomendasi 1", ...]
`;
  const raw = await analystChat(LEGACY_ANALYST_PROMPT, userMessage, { temperature: 0.5, max_tokens: 1024 });
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as string[];
}

export async function runAttentionAnalysis(
  sessionId: string, scriptIndex: number, gazePoints: GazePoint[], scriptContent: string
): Promise<AttentionReport> {
  const fixations          = extractFixations(gazePoints);
  const heatmapData        = buildHeatmapData(gazePoints);
  const aiRecommendations  = await generateAttentionRecommendations(fixations, heatmapData, scriptContent);
  return { sessionId, scriptIndex, gazePoints, fixations, heatmapData, aiRecommendations, recordedAt: Date.now() };
}
