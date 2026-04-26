import type { Metadata } from "next";
import { Thermometer, Info } from "lucide-react";

export const metadata: Metadata = { title: "Heatmaps" };

const SESSIONS_WITH_DATA = [
  { id: "abc12345", topic: "Skincare untuk remaja Gen Z", date: "26 Apr 2026", points: 1240 },
  { id: "def67890", topic: "UMKM kuliner viral TikTok",   date: "25 Apr 2026", points: 890  },
];

export default function HeatmapsPage() {
  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1>Heatmaps</h1>
          <p style={{ marginTop: 4 }}>Visualisasi distribusi perhatian mata dari setiap sesi eye-tracking</p>
        </div>
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
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Heatmap interaktif memerlukan sesi Eye Tracking yang sudah selesai. Warna{" "}
          <strong style={{ color: "#EF4444" }}>merah</strong> = perhatian tinggi,{" "}
          <strong style={{ color: "#3B82F6" }}>biru</strong> = perhatian rendah.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {SESSIONS_WITH_DATA.map((s) => (
          <div key={s.id} className="bento-card">
            {/* Simulated heatmap canvas */}
            <div
              style={{
                height: 180,
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, var(--color-surface-3) 0%, var(--color-surface-2) 100%)",
                border: "1px solid var(--color-border)",
                marginBottom: 14,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Simulated hot spots */}
              {[
                { left: "15%", top: "20%", size: 70, opacity: 0.7 },
                { left: "25%", top: "35%", size: 50, opacity: 0.5 },
                { left: "50%", top: "50%", size: 40, opacity: 0.3 },
                { left: "70%", top: "25%", size: 35, opacity: 0.25 },
              ].map((spot, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: spot.left,
                    top: spot.top,
                    width: spot.size,
                    height: spot.size,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(239,68,68,${spot.opacity}) 0%, transparent 70%)`,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                  }}
                />
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                <Thermometer size={14} strokeWidth={2} />
                Heatmap Preview
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: 4 }}>
              {s.topic}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="caption">{s.date}</span>
              <span className="chip" style={{ fontSize: "0.6875rem" }}>{s.points.toLocaleString()} gaze pts</span>
            </div>
          </div>
        ))}

        {/* Empty placeholder card */}
        <div
          className="bento-card"
          style={{
            height: 260,
            border: "1px dashed var(--color-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "transparent",
            boxShadow: "none",
          }}
        >
          <Thermometer size={28} strokeWidth={1.25} color="var(--color-text-muted)" />
          <p style={{ fontSize: "0.875rem", textAlign: "center", maxWidth: 200 }}>
            Jalankan eye tracking session untuk melihat heatmap baru
          </p>
        </div>
      </div>
    </div>
  );
}
