"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Thermometer,
  Info,
  Eye,
  Clock,
  ChevronRight,
  Activity,
  Lightbulb,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase-client";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { AttentionReport, Session } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SessionWithAnalytics {
  session: Session & { platforms?: string[] };
  reports: AttentionReport[];
}

// ── HeatmapCanvas ─────────────────────────────────────────────────────────────
// Renders gaze heatmap from AttentionReport.heatmapData onto an HTML canvas.
// Each point is a radial gradient blob: red (hot) → transparent.
// Intensity is accumulated per cell (additive compositing).
function HeatmapCanvas({
  data,
  width = 400,
  height = 180,
}: {
  data: { x: number; y: number; value: number }[];
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = "rgba(10, 10, 20, 0.85)";
    ctx.fillRect(0, 0, width, height);

    // We need to normalise from source viewport coords (stored in heatmapData)
    // to canvas coords. The heatmap data x/y are already normalised 0-1 relative
    // to the source viewport, but we stored raw px. Re-normalise via max.
    const maxX = Math.max(...data.map((d) => d.x), 1);
    const maxY = Math.max(...data.map((d) => d.y), 1);
    const maxVal = Math.max(...data.map((d) => d.value), 1);

    // Additive heat accumulation on an offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const octx = offscreen.getContext("2d");
    if (!octx) return;

    const radius = Math.min(width, height) * 0.18;

    for (const pt of data) {
      const cx = (pt.x / maxX) * width;
      const cy = (pt.y / maxY) * height;
      const intensity = pt.value / maxVal;

      const grad = octx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(255, 0, 0, ${(intensity * 0.5).toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(255, 120, 0, ${(intensity * 0.25).toFixed(3)})`);
      grad.addColorStop(0.7, `rgba(0, 100, 255, ${(intensity * 0.12).toFixed(3)})`);
      grad.addColorStop(1, "rgba(0, 0, 255, 0)");

      octx.fillStyle = grad;
      octx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }

    // Composite heatmap over dark background
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(offscreen, 0, 0);

    // Subtle grid overlay
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += width / 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += height / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontSize: "0.8125rem",
          gap: 6,
        }}
      >
        <Thermometer size={14} /> Tidak ada data gaze
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: "100%", height, borderRadius: 12, display: "block" }}
    />
  );
}

// ── Session Heatmap Card ───────────────────────────────────────────────────────
function SessionHeatmapCard({ item }: { item: SessionWithAnalytics }) {
  const { session, reports } = item;
  const [activeReport, setActiveReport] = useState(0);

  const report = reports[activeReport];
  const totalGaze = reports.reduce((sum, r) => sum + r.gazePoints.length, 0);

  return (
    <div className="bento-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
            {session.topic}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <Clock size={11} />
            {new Date(session.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            <span style={{ marginLeft: 4, padding: "1px 8px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 999, fontWeight: 600 }}>
              <Activity size={9} style={{ display: "inline", marginRight: 3 }} />
              {totalGaze.toLocaleString()} gaze pts
            </span>
          </div>
        </div>
        <Link
          href={`/dashboard/sessions/${session.id}`}
          style={{ textDecoration: "none", flexShrink: 0 }}
        >
          <div
            style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-accent-text)", display: "flex", alignItems: "center", gap: 3, padding: "4px 10px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 999 }}
          >
            Detail <ChevronRight size={12} />
          </div>
        </Link>
      </div>

      {/* Script tabs */}
      {reports.length > 1 && (
        <div style={{ display: "flex", gap: 6 }}>
          {reports.map((r, i) => (
            <button
              key={i}
              onClick={() => setActiveReport(i)}
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "3px 12px",
                borderRadius: 999,
                border: `1px solid ${i === activeReport ? "var(--color-accent)" : "var(--color-border)"}`,
                background: i === activeReport ? "var(--color-accent-subtle)" : "var(--color-surface-2)",
                color: i === activeReport ? "var(--color-accent-text)" : "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              Skrip {r.scriptIndex + 1}
            </button>
          ))}
        </div>
      )}

      {/* Canvas heatmap */}
      {report && (
        <HeatmapCanvas data={report.heatmapData} height={190} />
      )}

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "rgba(255,0,0,0.7)" }} />
          Perhatian tinggi
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "rgba(0,100,255,0.6)" }} />
          Perhatian rendah
        </div>
        {report && (
          <span style={{ marginLeft: "auto" }}>
            {report.gazePoints.length} pts · Skrip {report.scriptIndex + 1}
          </span>
        )}
      </div>

      {/* AI Recommendations */}
      {report && report.aiRecommendations.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: "0.78rem", fontWeight: 700, color: "var(--color-accent-text)" }}>
            <Lightbulb size={13} /> Rekomendasi AI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {report.aiRecommendations.slice(0, 3).map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--color-accent-text)", fontWeight: 800, flexShrink: 0, fontSize: "0.72rem", paddingTop: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HeatmapsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SessionWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth still loading — keep the loading skeleton; do nothing yet
    if (authLoading) return;

    // Auth done, but no user → show empty state
    if (!user) {
      setLoading(false);
      return;
    }

    // Auth done + user present → subscribe to Firestore
    setLoading(true);

    // Fetch all sessions for this user
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const sessions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Session & { platforms?: string[] }));

        // For each session, fetch analytics subcollection
        const withAnalytics = await Promise.all(
          sessions.map(async (session) => {
            try {
              const analyticsSnap = await getDocs(
                collection(db, "sessions", session.id, "analytics")
              );
              const reports = analyticsSnap.docs.map((d) => d.data() as AttentionReport);
              return { session, reports };
            } catch {
              return { session, reports: [] };
            }
          })
        );

        // Only keep sessions that have at least one analytics report
        setItems(withAnalytics.filter((item) => item.reports.length > 0));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user, authLoading]);


  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="animate-fade-in-up">
        <div className="page-header">
          <div><h1>Heatmaps</h1></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {[1, 2].map((i) => (
            <div key={i} className="bento-card skeleton" style={{ height: 340 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1>Heatmaps</h1>
          <p style={{ marginTop: 4 }}>
            Visualisasi distribusi perhatian mata dari setiap sesi eye-tracking
          </p>
        </div>
        {items.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 999, fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            <Eye size={13} strokeWidth={2} />
            {items.length} sesi tersedia
          </div>
        )}
      </div>

      {/* Info banner */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 16px",
          background: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
          borderRadius: "var(--radius-md)",
          marginBottom: 24,
        }}
      >
        <Info size={16} strokeWidth={2} color="var(--color-accent-text)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
          Heatmap dihasilkan dari data pergerakan mata kamu saat membaca skrip. Warna{" "}
          <strong style={{ color: "#EF4444" }}>merah</strong> = perhatian tinggi,{" "}
          <strong style={{ color: "#3B82F6" }}>biru</strong> = perhatian rendah. Jalankan Eye Tracking
          di halaman detail sesi untuk menghasilkan data baru.
        </p>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "80px 24px",
            background: "var(--color-surface)",
            border: "1.5px dashed var(--color-border)",
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FolderOpen size={24} color="var(--color-text-muted)" />
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
            Belum ada data heatmap. Buka sesi yang sudah selesai dan jalankan{" "}
            <strong>Eye Tracking</strong> di bagian Strategi Konten untuk mulai merekam data pergerakan mata.
          </p>
          <Link href="/dashboard/sessions" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary" style={{ marginTop: 4, fontSize: "0.875rem" }}>
              <Eye size={14} strokeWidth={2} /> Lihat Sesi
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {items.map((item) => (
            <SessionHeatmapCard key={item.session.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
