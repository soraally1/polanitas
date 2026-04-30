"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAccessibility } from "@/hooks/use-accessibility";
import { useWebGazer } from "@/hooks/use-webgazer";
import { Eye, EyeOff, Target, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Dwell configuration ────────────────────────────────────────────────────────
const DWELL_RADIUS = 50;
const DWELL_TIME_MS = 1500;

export function EyeTrackingNavigation() {
  const { user } = useAuth();
  const { prefs } = useAccessibility(user?.uid);
  const hasHandDisability = prefs?.hasHandDisability ?? false;

  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Dwell & Position state
  const [dwellProgress, setDwellProgress] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const latestCursorPos = useRef({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<string | null>(null);

  const dwellCenter = useRef<{ x: number; y: number } | null>(null);
  const dwellStartTime = useRef<number>(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  }

  // ── Gaze Handler (Dwell Click Logic) ─────────────────────────────────────────
  const handleGaze = useCallback((x: number, y: number) => {
    latestCursorPos.current = { x, y };
    setCursorPos({ x, y });

    const now = Date.now();
    if (!dwellCenter.current) {
      dwellCenter.current = { x, y };
      dwellStartTime.current = now;
      setDwellProgress(0);
      return;
    }

    const dist = Math.hypot(x - dwellCenter.current.x, y - dwellCenter.current.y);
    if (dist > DWELL_RADIUS) {
      // Reset dwell
      dwellCenter.current = { x, y };
      dwellStartTime.current = now;
      setDwellProgress(0);
    } else {
      // Increment dwell
      const elapsed = now - dwellStartTime.current;
      const progress = Math.min(100, (elapsed / DWELL_TIME_MS) * 100);
      setDwellProgress(progress);

      if (progress >= 100) {
        // Trigger click!
        const el = document.elementFromPoint(x, y);
        if (el && el.tagName !== "BODY" && el.tagName !== "HTML") {
          // Highlight element briefly
          const htmlEl = el as HTMLElement;
          const oldOutline = htmlEl.style.outline;
          htmlEl.style.outline = "3px solid var(--color-primary)";
          setTimeout(() => {
            htmlEl.style.outline = oldOutline;
          }, 300);

          htmlEl.click();
          showFeedback("🖱️ Dwell Click");
        }
        
        // Reset after click to prevent multi-clicking
        dwellCenter.current = null;
        setDwellProgress(0);
      }
    }
  }, []);

  // ── Blink Handler (Blink to Click) ───────────────────────────────────────────
  const handleBlink = useCallback(() => {
    const { x, y } = latestCursorPos.current;
    
    const el = document.elementFromPoint(x, y);
    if (el && el.tagName !== "BODY" && el.tagName !== "HTML") {
      const htmlEl = el as HTMLElement;
      const oldOutline = htmlEl.style.outline;
      htmlEl.style.outline = "3px solid var(--color-primary)";
      setTimeout(() => {
        htmlEl.style.outline = oldOutline;
      }, 300);

      htmlEl.click();
      showFeedback("👁️ Blink Click");
    }
    
    // Reset dwell progress as click has happened
    dwellCenter.current = null;
    setDwellProgress(0);
  }, []);

  const { isReady, isTracking, error, startTracking, stopTracking } = useWebGazer();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (enabled && isReady && !isTracking) {
      // Start with prediction points ON for navigation, pass both gaze and blink handlers
      startTracking(undefined, true, handleGaze, handleBlink);
    } else if (!enabled && isTracking) {
      stopTracking();
      setDwellProgress(0);
    }
  }, [enabled, isReady, isTracking, startTracking, stopTracking, handleGaze]);

  if (!mounted) return null;
  if (!hasHandDisability) return null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Calibration Overlay */}
      <AnimatePresence>
        {isCalibrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="bg-surface border border-border p-6 rounded-2xl shadow-xl max-w-md text-center relative z-10">
              <h2 className="text-xl font-bold text-primary mb-2">Kalibrasi Eye Tracking</h2>
              <p className="text-sm text-secondary leading-relaxed mb-6">
                Untuk hasil terbaik, minta bantuan pendamping untuk mengklik 9 titik merah yang muncul di layar, sambil Anda <b>terus menatap titik tersebut</b> saat diklik.
              </p>
              <button 
                onClick={() => setIsCalibrating(false)}
                className="btn btn-primary w-full justify-center"
              >
                Selesai Kalibrasi
              </button>
            </div>

            {/* 9 Calibration Dots */}
            {[
              { top: "5%", left: "5%" }, { top: "5%", left: "50%" }, { top: "5%", left: "95%" },
              { top: "50%", left: "5%" }, { top: "50%", left: "50%" }, { top: "50%", left: "95%" },
              { top: "95%", left: "5%" }, { top: "95%", left: "50%" }, { top: "95%", left: "95%" },
            ].map((pos, i) => (
              <button
                key={i}
                className="absolute w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 cursor-crosshair hover:bg-red-600 transition-colors"
                style={{ top: pos.top, left: pos.left }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = "var(--color-done)";
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Gaze Cursor with Dwell Indicator */}
      {enabled && isTracking && (
        <div 
          className="fixed z-[9998] pointer-events-none transition-transform duration-75 ease-linear"
          style={{ 
            left: cursorPos.x, 
            top: cursorPos.y,
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* The cursor dot */}
            <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]" />
            
            {/* Dwell progress ring */}
            {dwellProgress > 0 && (
              <svg className="absolute w-12 h-12 -rotate-90 opacity-80" viewBox="0 0 36 36">
                <path
                  className="text-border"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-primary transition-all duration-75 ease-linear"
                  strokeDasharray={`${dwellProgress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Widget UI (Placed slightly above the bottom-right so it doesn't overlap SpeechToAction) */}
      <div className="fixed bottom-36 right-6 z-[9999] flex flex-col items-end gap-2">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="bg-[color:var(--color-bg)] border border-border rounded-xl px-4 py-2.5 shadow-lg pointer-events-none"
            >
              <p className="text-xs font-bold text-primary">{feedback}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[color:var(--color-bg)] border border-border rounded-2xl shadow-lg overflow-hidden min-w-[190px]">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {!isReady ? (
                <Loader2 size={10} className="text-primary animate-spin shrink-0" />
              ) : isTracking ? (
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-border shrink-0" />
              )}
              <span className="text-[10px] font-bold text-secondary truncate">
                {!isReady ? "Memuat Tracker..." : isTracking ? "Merekam Mata" : "Eye Tracker Mati"}
              </span>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setEnabled(!enabled)}
              disabled={!isReady}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border-none disabled:opacity-50
                ${enabled ? "bg-primary text-[color:var(--color-bg)]" : "bg-surface-2 text-muted hover:bg-surface"}`}
              title={enabled ? "Matikan Tracker" : "Aktifkan Tracker"}
            >
              {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>

            {/* Collapse */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-7 h-7 rounded-full bg-surface-2 text-muted hover:bg-surface flex items-center justify-center cursor-pointer border-none transition-colors"
            >
              {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Expandable Body */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="px-3 py-3 flex flex-col gap-2">
                  <p className="text-[10px] text-muted leading-relaxed">
                    Tatap sebuah tombol selama 1.5 detik, <b>atau kedipkan mata Anda (0.5 - 1.5 detik)</b> untuk mengkliknya otomatis.
                  </p>
                  <button
                    onClick={() => setIsCalibrating(true)}
                    className="btn btn-secondary btn-sm w-full justify-center flex items-center gap-1.5"
                  >
                    <Target size={12} /> Kalibrasi Akurasi
                  </button>
                </div>
                {error && (
                  <div className="mx-3 mb-3 text-[10px] text-error bg-error/10 rounded-lg p-2 leading-relaxed">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
