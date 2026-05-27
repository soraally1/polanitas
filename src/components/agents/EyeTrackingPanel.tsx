"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { useIrisGaze } from "@/hooks/use-iris-gaze";
import { submitGazeData } from "@/actions/agent-actions";
import { AttentionReport, ContentScript, GazePoint, YouTubeTrend } from "@/types";
import {
  Eye,
  StopCircle,
  Lightbulb,
  Activity,
  AlertTriangle,
  CheckCircle,
  Play,
  Timer,
  Video,
  ScanFace,
} from "lucide-react";

interface EyeTrackingPanelProps {
  sessionId: string;
  scripts: ContentScript[];
  analytics: AttentionReport[];
  youtubeTrends?: YouTubeTrend[];
}

type TrackingMode = "video" | "script";
const DURATION_OPTIONS = [5, 15, 30, 60];

export default function EyeTrackingPanel({
  sessionId,
  scripts,
  analytics,
  youtubeTrends = [],
}: EyeTrackingPanelProps) {
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);
  const [mode, setMode] = useState<TrackingMode>(youtubeTrends.length > 0 ? "video" : "script");
  const [duration, setDuration] = useState(5);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ type: "success" | "error" | "warn"; text: string } | null>(null);
  const [gazePos, setGazePos] = useState<{ x: number; y: number } | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Accumulate gaze points ourselves — face tracker fires per-frame
  const gazeBufferRef = useRef<GazePoint[]>([]);
  const viewportRef = useRef({ w: 0, h: 0 });
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);

  // Gaze callback: called each frame by face tracker
  const onGaze = useCallback((x: number, y: number) => {
    setGazePos({ x, y });
    if (isRecordingRef.current) {
      gazeBufferRef.current.push({
        x, y,
        timestamp: Date.now(),
        viewport: viewportRef.current,
      });
    }
  }, []);

  const { isReady, isTracking, isFaceDetected, isCalibrating, error, startTracking, stopTracking } =
    useIrisGaze(onGaze);

  const activeScript = scripts[activeScriptIndex];
  const scriptReport = analytics.find((r) => r.scriptIndex === activeScriptIndex);
  const activeVideo = youtubeTrends[0];

  // Capture viewport size on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      viewportRef.current = { w: window.innerWidth, h: window.innerHeight };
    }
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
    };
  }, []);

  function startCountdown(targetDuration: number, onEnd: () => void) {
    setCountdown(targetDuration);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    autoStopRef.current = setTimeout(onEnd, targetDuration * 1000);
  }

  async function handleStart() {
    setResult(null);
    gazeBufferRef.current = [];
    viewportRef.current = { w: window.innerWidth, h: window.innerHeight };

    // Start face tracker (async: opens camera + starts MediaPipe)
    await startTracking();

    // Begin recording gaze points
    isRecordingRef.current = true;
    setVideoPlaying(true);

    // Start countdown → auto-stop
    startCountdown(duration, () => {
      handleStopAndAnalyze();
    });
  }

  function handleStopAndAnalyze() {
    // Stop timers
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    setCountdown(null);
    setVideoPlaying(false);

    // Freeze the buffer first, then stop the tracker
    isRecordingRef.current = false;
    const gazePoints = [...gazeBufferRef.current];
    gazeBufferRef.current = [];
    setGazePos(null);
    stopTracking();

    if (gazePoints.length < 5) {
      setResult({
        type: "warn",
        text: `Tidak cukup data (${gazePoints.length} titik). Pastikan wajah terdeteksi & terang, lalu coba lagi.`,
      });
      return;
    }

    const content = mode === "video"
      ? `[VIDEO] ${activeVideo?.title ?? "YouTube Video"}`
      : activeScript.script;

    startTransition(async () => {
      const res = await submitGazeData(
        { sessionId, scriptIndex: activeScriptIndex, scriptContent: content },
        gazePoints
      );
      if (res?.report) {
        setResult({ type: "success", text: `Analisis selesai! ${gazePoints.length} titik gaze direkam.` });
      } else {
        setResult({ type: "error", text: `Error: ${JSON.stringify(res?.error)}` });
      }
    });
  }

  const progress = countdown !== null ? ((duration - countdown) / duration) * 100 : 0;
  const isRunning = isTracking && isRecordingRef.current;

  return (
    <div className="bento-card animate-fade-in-up">
      {/* Live gaze dot (fixed overlay on screen) */}
      {isRunning && gazePos && (
        <div
          style={{
            position: "fixed",
            left: gazePos.x - 12,
            top: gazePos.y - 12,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(74, 222, 128, 0.75)",
            border: "2px solid #fff",
            pointerEvents: "none",
            zIndex: 9999,
            boxShadow: "0 0 14px rgba(74,222,128,0.55)",
            transition: "left 0.08s linear, top 0.08s linear",
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-[18px]">
        <div className="flex items-center gap-2.5">
          <ScanFace size={18} strokeWidth={1.75} className="text-accent-text" />
          <div>
            <h3 className="m-0">Iris Gaze Analyst</h3>
            <p className="text-[0.8125rem] mt-[3px]">
              Rekam pergerakan mata (iris) saat menonton video atau membaca skrip
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCalibrating && (
            <span className="status-badge status-running">Kalibrasi…</span>
          )}
          {isFaceDetected && !isCalibrating && !isRunning && (
            <span className="status-badge" style={{ background: "color-mix(in srgb,#10B981 10%,transparent)", color: "#10B981", border: "1px solid #10B98140" }}>
              ● Wajah Terdeteksi
            </span>
          )}
          {!isReady && <span className="status-badge status-running">Memuat FaceMesh…</span>}
          {isReady && !isTracking && !isFaceDetected && <span className="status-badge status-idle">Kamera Siap</span>}
          {isRunning && countdown !== null && (
            <span className="status-badge status-running">● Merekam {countdown}s</span>
          )}
        </div>
      </div>

      {/* ── Mode switch ─────────────────────────────────────────────────────── */}
      {youtubeTrends.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          {(["video", "script"] as TrackingMode[]).map((m) => (
            <button
              key={m}
              onClick={() => !isTracking && setMode(m)}
              disabled={isTracking}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 9,
                border: "none",
                background: mode === m ? "var(--color-surface)" : "transparent",
                color: mode === m ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontWeight: mode === m ? 800 : 600,
                fontSize: "0.8125rem",
                cursor: isTracking ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              {m === "video" ? <Video size={13} /> : <Eye size={13} />}
              {m === "video" ? "Tonton Video" : "Baca Skrip"}
            </button>
          ))}
        </div>
      )}

      {/* ── Script tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-4">
        {scripts.map((s, i) => (
          <button
            key={i}
            id={`script-tab-${i}`}
            onClick={() => !isTracking && setActiveScriptIndex(i)}
            disabled={isTracking}
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

      {/* ── Duration picker ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Timer size={13} style={{ color: "var(--color-text-muted)" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Durasi:</span>
        {DURATION_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => !isTracking && setDuration(d)}
            disabled={isTracking}
            style={{
              padding: "3px 12px",
              borderRadius: 999,
              border: `1px solid ${duration === d ? "var(--color-accent)" : "var(--color-border)"}`,
              background: duration === d ? "var(--color-accent-subtle)" : "var(--color-surface-2)",
              color: duration === d ? "var(--color-accent-text)" : "var(--color-text-muted)",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: isTracking ? "not-allowed" : "pointer",
            }}
          >
            {d}s
          </button>
        ))}
      </div>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      {mode === "video" && activeVideo ? (
        <VideoTrackingArea
          video={activeVideo}
          isRunning={isRunning}
          videoPlaying={videoPlaying}
          countdown={countdown}
          duration={duration}
          progress={progress}
        />
      ) : (
        <div
          id="script-review-area"
          className={`py-[18px] px-5 bg-surface-2 border border-border rounded-[var(--radius-md)] mb-4 relative transition-[outline] duration-[var(--transition-fast)] ${isRunning ? "tracking-active" : ""}`}
        >
          {isRunning && (
            <div className="absolute top-2.5 right-3 flex items-center gap-1.5 py-1 px-2.5 bg-surface border border-border rounded-full text-[0.6875rem] font-bold text-running">
              <Activity size={10} strokeWidth={2} />
              {countdown !== null ? `${countdown}s tersisa` : "Merekam…"}
            </div>
          )}
          <div className="caption text-accent-text mb-2">Viral Hook</div>
          <div className="font-bold text-[1.0625rem] mb-3.5 text-primary leading-[1.35]">
            &ldquo;{activeScript?.viralHook}&rdquo;
          </div>
          <p className="text-sm leading-[1.8]">{activeScript?.script}</p>

          {/* Script progress bar */}
          {isRunning && (
            <div style={{ marginTop: 12, height: 3, background: "var(--color-surface-3, var(--color-border))", borderRadius: 99 }}>
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, var(--color-accent), #4ade80)",
                  width: `${progress}%`,
                  borderRadius: 99,
                  transition: "width 1s linear",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      {!isTracking ? (
        <button
          id="start-eye-tracking-btn"
          onClick={handleStart}
          disabled={!isReady || isPending}
          className="btn btn-primary w-full"
          style={{ gap: 8 }}
        >
          <ScanFace size={15} strokeWidth={2} />
          {!isReady
            ? "Memuat FaceMesh…"
            : mode === "video"
            ? `Rekam ${duration}s Saat Menonton Video`
            : `Rekam ${duration}s Saat Membaca Skrip`}
        </button>
      ) : (
        <button
          id="stop-eye-tracking-btn"
          onClick={handleStopAndAnalyze}
          disabled={isPending}
          className="btn btn-danger w-full"
          style={{ gap: 8 }}
        >
          <StopCircle size={15} strokeWidth={2} />
          {isPending
            ? "Menganalisis…"
            : isCalibrating
            ? "Kalibrasi… tunggu sebentar"
            : `Hentikan & Analisis (${countdown ?? 0}s tersisa)`}
        </button>
      )}

      {/* Feedback */}
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
              : result.type === "warn"
              ? "bg-[color-mix(in_srgb,var(--color-running)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-running)_30%,transparent)] text-running"
              : "bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] text-error"
          }`}
        >
          {result.type === "success"
            ? <CheckCircle size={14} strokeWidth={2} className="shrink-0 mt-0.5" />
            : <AlertTriangle size={14} strokeWidth={2} className="shrink-0 mt-0.5" />}
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

// ── VideoTrackingArea ─────────────────────────────────────────────────────────
function VideoTrackingArea({
  video,
  isRunning,
  videoPlaying,
  countdown,
  duration,
  progress,
}: {
  video: YouTubeTrend;
  isRunning: boolean;
  videoPlaying: boolean;
  countdown: number | null;
  duration: number;
  progress: number;
}) {
  const embedUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=${videoPlaying ? 1 : 0}&rel=0&modestbranding=1&controls=1`;

  return (
    <div
      id="video-tracking-area"
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `2px solid ${isRunning ? "var(--color-accent)" : "var(--color-border)"}`,
        marginBottom: 16,
        position: "relative",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: isRunning ? "0 0 0 4px color-mix(in srgb, var(--color-accent) 15%, transparent)" : "none",
      }}
    >
      {/* Video iframe */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
        <iframe
          key={videoPlaying ? "playing" : "idle"}
          src={embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
        {/* Recording indicator */}
        {isRunning && countdown !== null && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 800,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <Activity size={13} color="#4ade80" />
            <span style={{ color: "#4ade80" }}>{countdown}s</span>
            <span style={{ opacity: 0.6, fontWeight: 400 }}>tersisa</span>
          </div>
        )}
        {/* Prompt to start */}
        {!isRunning && !videoPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                borderRadius: 14,
                padding: "12px 20px",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Play size={16} fill="#fff" strokeWidth={0} />
              Tekan tombol hijau untuk mulai rekam
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div style={{ height: 4, background: "var(--color-surface-2)" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, var(--color-accent), #4ade80)",
              width: `${progress}%`,
              transition: "width 1s linear",
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "10px 14px", background: "var(--color-surface-2)" }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.8125rem",
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {video.title}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 2, fontWeight: 600 }}>
          {video.channelTitle}
        </div>
      </div>
    </div>
  );
}
