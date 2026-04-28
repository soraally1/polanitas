"use client";

import { useState, useTransition } from "react";
import { useWebGazer } from "@/hooks/use-webgazer";
import { submitGazeData } from "@/actions/agent-actions";
import { AttentionReport, ContentScript } from "@/types";
import { Eye, StopCircle, Lightbulb, Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface EyeTrackingPanelProps {
  sessionId: string;
  scripts: ContentScript[];
  analytics: AttentionReport[];
}

export default function EyeTrackingPanel({ sessionId, scripts, analytics }: EyeTrackingPanelProps) {
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: "success" | "error" | "warn"; text: string } | null>(null);

  const { isReady, isTracking, error, startTracking, stopTracking, pointCount } = useWebGazer();

  const activeScript = scripts[activeScriptIndex];
  const scriptReport = analytics.find((r) => r.scriptIndex === activeScriptIndex);

  function handleStart() {
    startTracking("script-review-area");
  }

  function handleStopAndAnalyze() {
    const gazePoints = stopTracking();
    if (gazePoints.length < 10) {
      setResult({ type: "warn", text: "Tidak cukup data gaze. Coba lagi dengan durasi lebih lama." });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await submitGazeData(
        { sessionId, scriptIndex: activeScriptIndex, scriptContent: activeScript.script },
        gazePoints
      );
      if (res?.report) {
        setResult({ type: "success", text: "Analisis selesai! Rekomendasi telah diperbarui." });
      } else {
        setResult({ type: "error", text: `Error: ${JSON.stringify(res?.error)}` });
      }
    });
  }

  return (
    <div className="bento-card animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-[18px]">
        <div className="flex items-center gap-2.5">
          <Eye size={18} strokeWidth={1.75} className="text-accent-text" />
          <div>
            <h3 className="m-0">Eye Tracking Analyst</h3>
            <p className="text-[0.8125rem] mt-[3px]">
              Rekam pergerakan mata saat membaca skrip untuk analisis berbasis data
            </p>
          </div>
        </div>
        {!isReady && <span className="status-badge status-running">Memuat WebGazer</span>}
        {isReady && !isTracking && <span className="status-badge status-idle">Kamera Siap</span>}
        {isTracking && <span className="status-badge status-running">Merekam</span>}
      </div>

      {/* Script tabs */}
      <div className="flex gap-1.5 mb-4">
        {scripts.map((s, i) => (
          <button
            key={i}
            id={`script-tab-${i}`}
            onClick={() => setActiveScriptIndex(i)}
            className={`btn btn-ghost btn-sm ${
              i === activeScriptIndex
                ? "border-accent text-accent-text bg-accent-subtle font-bold"
                : ""
            }`}
          >
            {s.duration}
          </button>
        ))}
      </div>

      {/* Review area */}
      <div
        id="script-review-area"
        className={`py-[18px] px-5 bg-surface-2 border border-border rounded-[var(--radius-md)] mb-4 relative transition-[outline] duration-[var(--transition-fast)] ${isTracking ? "tracking-active" : ""}`}
      >
        {isTracking && (
          <div className="absolute top-2.5 right-3 flex items-center gap-1.5 py-1 px-2.5 bg-surface border border-border rounded-full text-[0.6875rem] font-bold text-running">
            <Activity size={10} strokeWidth={2} />
            {pointCount} pts
          </div>
        )}

        <div className="caption text-accent-text mb-2">
          Viral Hook
        </div>
        <div className="font-bold text-[1.0625rem] mb-3.5 text-primary leading-[1.35]">
          &ldquo;{activeScript.viralHook}&rdquo;
        </div>
        <p className="text-sm leading-[1.8]">{activeScript.script}</p>
      </div>

      {/* Controls */}
      {!isTracking ? (
        <button
          id="start-eye-tracking-btn"
          onClick={handleStart}
          disabled={!isReady || isPending}
          className="btn btn-primary w-full"
        >
          <Eye size={15} strokeWidth={2} />
          {!isReady ? "Memuat Kamera..." : "Mulai Rekam Pergerakan Mata"}
        </button>
      ) : (
        <button
          id="stop-eye-tracking-btn"
          onClick={handleStopAndAnalyze}
          disabled={isPending}
          className="btn btn-danger w-full"
        >
          <StopCircle size={15} strokeWidth={2} />
          {isPending ? "Menganalisis..." : "Hentikan & Analisis Sekarang"}
        </button>
      )}

      {/* Feedback messages */}
      {error && (
        <div className="mt-2.5 py-2.5 px-3.5 bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] rounded-[var(--radius-sm)] text-sm text-error flex items-start gap-2">
          <AlertTriangle size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {result && (
        <div
          className={`mt-2.5 py-2.5 px-3.5 rounded-[var(--radius-sm)] text-sm flex items-start gap-2 ${
            result.type === "success"
              ? "bg-accent-subtle border border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] text-accent-text"
              : "bg-[color-mix(in_srgb,var(--color-running)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-running)_30%,transparent)] text-running"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
          )}
          {result.text}
        </div>
      )}

      {/* AI Recommendations */}
      {scriptReport && scriptReport.aiRecommendations.length > 0 && (
        <div className="mt-[22px]">
          <div className="divider" />
          <div className="flex items-center gap-2 mb-3.5">
            <Lightbulb size={15} strokeWidth={1.75} className="text-accent-text" />
            <span className="caption">Rekomendasi AI Analyst</span>
          </div>
          <div className="flex flex-col gap-2">
            {scriptReport.aiRecommendations.map((rec, i) => (
              <div key={i} className="rec-item">
                <span className="caption text-accent-text pt-0.5 shrink-0 font-extrabold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-[1.65]">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
