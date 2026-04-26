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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Eye size={18} strokeWidth={1.75} color="var(--color-accent-text)" />
          <div>
            <h3 style={{ margin: 0 }}>Eye Tracking Analyst</h3>
            <p style={{ fontSize: "0.8125rem", marginTop: 3 }}>
              Rekam pergerakan mata saat membaca skrip untuk analisis berbasis data
            </p>
          </div>
        </div>
        {!isReady && <span className="status-badge status-running">Memuat WebGazer</span>}
        {isReady && !isTracking && <span className="status-badge status-idle">Kamera Siap</span>}
        {isTracking && <span className="status-badge status-running">Merekam</span>}
      </div>

      {/* Script tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {scripts.map((s, i) => (
          <button
            key={i}
            id={`script-tab-${i}`}
            onClick={() => setActiveScriptIndex(i)}
            className="btn btn-ghost btn-sm"
            style={
              i === activeScriptIndex
                ? {
                    borderColor: "var(--color-accent)",
                    color: "var(--color-accent-text)",
                    background: "var(--color-accent-subtle)",
                    fontWeight: 700,
                  }
                : {}
            }
          >
            {s.duration}
          </button>
        ))}
      </div>

      {/* Review area */}
      <div
        id="script-review-area"
        className={isTracking ? "tracking-active" : ""}
        style={{
          padding: "18px 20px",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 16,
          position: "relative",
          transition: "outline var(--transition-fast)",
        }}
      >
        {isTracking && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "var(--color-running)",
            }}
          >
            <Activity size={10} strokeWidth={2} />
            {pointCount} pts
          </div>
        )}

        <div className="caption" style={{ color: "var(--color-accent-text)", marginBottom: 8 }}>
          Viral Hook
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: 14, color: "var(--color-text-primary)", lineHeight: 1.35 }}>
          &ldquo;{activeScript.viralHook}&rdquo;
        </div>
        <p style={{ fontSize: "0.875rem", lineHeight: 1.8 }}>{activeScript.script}</p>
      </div>

      {/* Controls */}
      {!isTracking ? (
        <button
          id="start-eye-tracking-btn"
          onClick={handleStart}
          disabled={!isReady || isPending}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          <Eye size={15} strokeWidth={2} />
          {!isReady ? "Memuat Kamera..." : "Mulai Rekam Pergerakan Mata"}
        </button>
      ) : (
        <button
          id="stop-eye-tracking-btn"
          onClick={handleStopAndAnalyze}
          disabled={isPending}
          className="btn btn-danger"
          style={{ width: "100%" }}
        >
          <StopCircle size={15} strokeWidth={2} />
          {isPending ? "Menganalisis..." : "Hentikan & Analisis Sekarang"}
        </button>
      )}

      {/* Feedback messages */}
      {error && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-error) 30%, transparent)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.875rem",
            color: "var(--color-error)",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            background:
              result.type === "success"
                ? "var(--color-accent-subtle)"
                : result.type === "warn"
                ? "color-mix(in srgb, var(--color-running) 10%, transparent)"
                : "color-mix(in srgb, var(--color-error) 10%, transparent)",
            border: `1px solid ${
              result.type === "success"
                ? "color-mix(in srgb, var(--color-accent) 30%, transparent)"
                : "color-mix(in srgb, var(--color-running) 30%, transparent)"
            }`,
            borderRadius: "var(--radius-sm)",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            color: result.type === "success" ? "var(--color-accent-text)" : "var(--color-running)",
          }}
        >
          {result.type === "success" ? (
            <CheckCircle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          {result.text}
        </div>
      )}

      {/* AI Recommendations */}
      {scriptReport && scriptReport.aiRecommendations.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div className="divider" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Lightbulb size={15} strokeWidth={1.75} color="var(--color-accent-text)" />
            <span className="caption">Rekomendasi AI Analyst</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scriptReport.aiRecommendations.map((rec, i) => (
              <div key={i} className="rec-item">
                <span
                  className="caption"
                  style={{ color: "var(--color-accent-text)", paddingTop: 2, flexShrink: 0, fontWeight: 800 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
