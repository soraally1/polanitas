import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Kurikulum — POLANITAS" };

// ── 12 Modules ──────────────────────────────────────────────────────────────
const MODULES = [
  { id: "ai-orchestration", num: 1, title: "Orkestrasi AI", subtitle: "Belajar mendelegasikan tugas ke agen AI otonom untuk efisiensi.", color: "#84CC16", available: true },
  { id: "trend-signal", num: 2, title: "Deteksi Tren Dini", subtitle: "Mendeteksi noise vs. sinyal tren nyata di sosial media.", color: "#F97316", available: true },
  { id: "marketplace-whitespace", num: 3, title: "Whitespace Marketplace", subtitle: "Menemukan celah pasar dengan kompetisi konten rendah.", color: "#EF4444", available: true },
  { id: "eye-tracking", num: 4, title: "Psikologi Visual", subtitle: "Optimasi hierarki visual menggunakan prinsip eye tracking.", color: "#0EA5E9", available: true },
  { id: "llm-copywriting", num: 5, title: "Copywriting LLM", subtitle: "Otomatisasi pembuatan ribuan caption personalisasi.", color: "#8B5CF6", available: true },
  { id: "content-atomization", num: 6, title: "Content Atomization", subtitle: "Memecah satu ide besar menjadi puluhan aset multi-platform.", color: "#EC4899", available: true },
  { id: "neuromarketing", num: 7, title: "Neuromarketing", subtitle: "Desain analitik untuk pengambilan keputusan instan.", color: "#14B8A6", available: false },
  { id: "crisis-management", num: 8, title: "Manajemen Krisis", subtitle: "Sistem AI untuk memantau dan merespon sentimen negatif.", color: "#EAB308", available: false },
  { id: "roi-attribution", num: 9, title: "Atribusi ROI", subtitle: "Menghubungkan metrik engagement dengan penjualan nyata.", color: "#6366F1", available: false },
  { id: "ai-ethics", num: 10, title: "Etika AI & Organisasi", subtitle: "Kebijakan penggunaan AI yang aman untuk reputasi brand.", color: "#64748B", available: false },
  { id: "influencer-dna", num: 11, title: "Influencer Matching", subtitle: "Pencocokan vibe dengan influencer menggunakan vector search.", color: "#D946EF", available: false },
  { id: "ab-testing", num: 12, title: "A/B Testing Agresif", subtitle: "Menjalankan variasi iklan masif untuk iterasi otomatis.", color: "#06B6D4", available: false },
] as const;

export default function LearnIndexPage() {
  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 56, paddingBottom: 64 }}>
      
      {/* ── Minimalist Header ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.04em", marginBottom: 16, lineHeight: 1.1 }}>
          Kurikulum Polanitas
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          12 modul esensial yang dirancang secara profesional. Dari fundamental analitik hingga kepemimpinan orkestrasi AI tingkat lanjut.
        </p>
      </div>

      {/* ── Modules Grid ──────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}
      >
        {MODULES.map((m) => {
          const Content = (
            <div
              className={`module-card ${m.available ? "module-card--active" : "module-card--inactive"}`}
            >
              {/* Colored Top Block */}
              <div
                style={{
                  background: m.color,
                  borderRadius: 14,
                  height: 130,
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Large Text Effect */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: "4.5rem",
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.9)",
                      lineHeight: 0.8,
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {m.num}
                  </span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    mod
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "20px 14px 10px", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 8, lineHeight: 1.3 }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: 24, flex: 1 }}>
                  {m.subtitle}
                </p>

                {/* CTA Link */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: m.available ? m.color : "var(--color-text-muted)",
                  }}
                >
                  {m.available ? "Pelajari" : "Segera Hadir"}
                  {m.available && <ChevronRight size={14} />}
                </div>
              </div>
            </div>
          );

          if (m.available) {
            return (
              <Link key={m.id} href={`/dashboard/learn/${m.id}`} style={{ textDecoration: "none" }}>
                {Content}
              </Link>
            );
          }
          
          return React.cloneElement(Content, { key: m.id });
        })}
      </div>
    </div>
  );
}
