/**
 * POLANITAS — useIrisGaze
 *
 * Iris-based gaze estimation using MediaPipe FaceMesh (refineLandmarks=true).
 *
 * How it works:
 *   1. Detect left & right iris centers (lm 473, 468).
 *   2. Compute normalized iris position within each eye socket
 *      (0 = fully left, 0.5 = center, 1 = fully right).
 *   3. Average both eyes → horizontal gaze ratio.
 *   4. Apply the same logic vertically.
 *   5. Auto-calibrate center offset from the first CALIB_FRAMES frames.
 *   6. Map offset to screen coordinates with EMA smoothing.
 *
 * Why iris > nose:
 *   Nose tip moves when you turn your head — but iris moves when you move
 *   your eyes. Iris position within the eye socket directly encodes gaze
 *   direction, independent of head orientation.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── MediaPipe types ───────────────────────────────────────────────────────────
interface Landmark { x: number; y: number; z: number; }
interface FaceMeshResults { multiFaceLandmarks?: Landmark[][]; }
interface FaceMeshInstance {
  setOptions(o: object): Promise<void>;
  onResults(cb: (r: FaceMeshResults) => void): void;
  send(i: { image: HTMLVideoElement }): Promise<void>;
  close(): void;
}

// ── Landmark indices (MediaPipe 478-point refined model) ──────────────────────
// Eye socket corners (standard 468-point model)
const L_OUTER  = 33;   const L_INNER  = 133; // Left eye horizontal corners
const R_INNER  = 362;  const R_OUTER  = 263; // Right eye horizontal corners
const L_TOP    = 159;  const L_BOT    = 145; // Left eye vertical
const R_TOP    = 386;  const R_BOT    = 374; // Right eye vertical
// Iris centers (only in 478-point model with refineLandmarks=true)
const L_IRIS   = 473;  // Left iris center
const R_IRIS   = 468;  // Right iris center

// ── Tuning constants ──────────────────────────────────────────────────────────
const CALIB_FRAMES  = 30;   // ~1s of frames to establish center offset
const EMA_ALPHA     = 0.20; // Higher = more responsive, more jitter (iris is already smooth)
const SENSITIVITY_X = 3.5;  // Amplify horizontal gaze offset
const SENSITIVITY_Y = 4.0;  // Amplify vertical gaze offset (eyes move less vertically)

export function useIrisGaze(onGaze?: (x: number, y: number) => void) {
  const [isReady,        setIsReady]        = useState(false);
  const [isTracking,     setIsTracking]     = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isCalibrating,  setIsCalibrating]  = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const fmRef           = useRef<FaceMeshInstance | null>(null);
  const videoRef        = useRef<HTMLVideoElement | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const rafRef          = useRef<number>(0);
  const runningRef      = useRef(false);
  const processingRef   = useRef(false);

  // Calibration state
  const calibSamples = useRef<{ x: number; y: number }[]>([]);
  const calibDone    = useRef(false);
  const ctrX         = useRef(0.5);
  const ctrY         = useRef(0.5);

  // EMA state
  const smX = useRef(-1);
  const smY = useRef(-1);

  const faceDetRef = useRef(false);

  // Live-swappable callback ref (avoids re-creating the handler on every render)
  const onGazeRef = useRef(onGaze);
  useEffect(() => { onGazeRef.current = onGaze; }, [onGaze]);

  // ── Load MediaPipe FaceMesh ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.FaceMesh) { setIsReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js";
    s.crossOrigin = "anonymous";
    s.async = true;
    s.onload = () => setIsReady(true);
    s.onerror = () => setError("Gagal memuat FaceMesh. Periksa koneksi internet.");
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

  // ── Per-frame result handler ────────────────────────────────────────────────
  const handleResults = useCallback((r: FaceMeshResults) => {
    if (!r.multiFaceLandmarks?.length) {
      if (faceDetRef.current) { faceDetRef.current = false; setIsFaceDetected(false); }
      return;
    }
    if (!faceDetRef.current) { faceDetRef.current = true; setIsFaceDetected(true); }

    const lm = r.multiFaceLandmarks[0];

    // ── Iris position within eye socket ──────────────────────────────────────
    // Horizontal: how far right the iris is within the eye (0=left, 0.5=center, 1=right)
    const lEyeW  = Math.abs(lm[L_INNER].x - lm[L_OUTER].x);
    const rEyeW  = Math.abs(lm[R_OUTER].x - lm[R_INNER].x);
    const lGazeX = lEyeW > 0 ? (lm[L_IRIS].x - lm[L_OUTER].x) / lEyeW : 0.5;
    const rGazeX = rEyeW > 0 ? (lm[R_IRIS].x - lm[R_INNER].x) / rEyeW : 0.5;
    const gazeX  = (lGazeX + rGazeX) / 2; // average both eyes

    // Vertical: how far down the iris is within the eye
    const lEyeH  = Math.abs(lm[L_BOT].y - lm[L_TOP].y);
    const rEyeH  = Math.abs(lm[R_BOT].y - lm[R_TOP].y);
    const lGazeY = lEyeH > 0 ? (lm[L_IRIS].y - lm[L_TOP].y) / lEyeH : 0.5;
    const rGazeY = rEyeH > 0 ? (lm[R_IRIS].y - lm[R_TOP].y) / rEyeH : 0.5;
    const gazeY  = (lGazeY + rGazeY) / 2;

    // Mirror X: MediaPipe camera frame is mirrored (right of frame = left of screen)
    const mirroredX = 1 - gazeX;

    // ── Auto-calibrate center ─────────────────────────────────────────────────
    if (!calibDone.current) {
      calibSamples.current.push({ x: mirroredX, y: gazeY });
      if (calibSamples.current.length >= CALIB_FRAMES) {
        const n = calibSamples.current.length;
        ctrX.current = calibSamples.current.reduce((s, p) => s + p.x, 0) / n;
        ctrY.current = calibSamples.current.reduce((s, p) => s + p.y, 0) / n;
        calibDone.current = true;
        calibSamples.current = [];
        smX.current = -1;
        smY.current = -1;
        setIsCalibrating(false);
      }
      return;
    }

    // ── Map iris offset to screen coords ─────────────────────────────────────
    // Center the offset around the calibrated neutral gaze position,
    // then amplify so small iris movements cover the full screen.
    const sx = Math.max(0, Math.min(window.innerWidth,
      (0.5 + (mirroredX - ctrX.current) * SENSITIVITY_X) * window.innerWidth,
    ));
    const sy = Math.max(0, Math.min(window.innerHeight,
      (0.5 + (gazeY - ctrY.current) * SENSITIVITY_Y) * window.innerHeight,
    ));

    // EMA smoothing
    smX.current = smX.current < 0 ? sx : smX.current + EMA_ALPHA * (sx - smX.current);
    smY.current = smY.current < 0 ? sy : smY.current + EMA_ALPHA * (sy - smY.current);

    onGazeRef.current?.(Math.round(smX.current), Math.round(smY.current));
  }, []);

  // ── RAF loop ────────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const vid = videoRef.current;
    if (!processingRef.current && fmRef.current && vid && vid.readyState >= 2) {
      processingRef.current = true;
      const watchdog = setTimeout(() => { processingRef.current = false; }, 1200);
      fmRef.current.send({ image: vid })
        .then(() => { clearTimeout(watchdog); processingRef.current = false; })
        .catch(() => { clearTimeout(watchdog); processingRef.current = false; });
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Start ───────────────────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    if (!isReady) { setError("FaceMesh belum siap."); return; }
    if (runningRef.current) { setIsTracking(true); return; }

    setError(null);
    setIsFaceDetected(false);
    setIsCalibrating(true);
    faceDetRef.current   = false;
    calibDone.current    = false;
    calibSamples.current = [];
    smX.current          = -1;
    smY.current          = -1;
    processingRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const vid          = document.createElement("video");
      vid.id             = "irisGazeVideo";
      vid.autoplay       = true;
      vid.playsInline    = true;
      vid.muted          = true;
      vid.srcObject      = stream;
      vid.style.cssText  = "position:fixed;right:12px;bottom:12px;width:120px;height:90px;border-radius:10px;object-fit:cover;z-index:9000;border:2px solid var(--color-accent,#6366f1);opacity:0.85;";
      document.body.appendChild(vid);
      videoRef.current   = vid;

      await new Promise<void>((res) => { vid.onloadeddata = () => res(); });

      const fm = new window.FaceMesh({ locateFile: (f: string) => `/mediapipe/face_mesh/${f}` });
      await fm.setOptions({
        maxNumFaces:            1,
        refineLandmarks:        true,  // ← Required for iris landmarks 468–477
        minDetectionConfidence: 0.6,
        minTrackingConfidence:  0.6,
      });
      fm.onResults(handleResults);
      fmRef.current = fm;

      runningRef.current = true;
      setIsTracking(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch (err: unknown) {
      let msg = "Gagal memulai kamera.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") msg = "Akses kamera ditolak. Izinkan di browser.";
        else if (err.name === "NotFoundError") msg = "Kamera tidak ditemukan.";
        else msg = err.message;
      }
      setError(msg);
      setIsTracking(false);
      setIsCalibrating(false);
    }
  }, [isReady, handleResults, loop]);

  // ── Stop ────────────────────────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    try { fmRef.current?.close(); } catch (_) { /* ignore */ }
    fmRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    videoRef.current?.remove();
    videoRef.current = null;
    document.getElementById("irisGazeVideo")?.remove();
    faceDetRef.current    = false;
    processingRef.current = false;
    setIsTracking(false);
    setIsCalibrating(false);
    setIsFaceDetected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopTracking(); }, [stopTracking]);

  return {
    isReady,
    isTracking,
    isFaceDetected,
    isCalibrating,
    error,
    startTracking,
    stopTracking,
  };
}
