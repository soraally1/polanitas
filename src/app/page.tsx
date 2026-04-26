import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  Search,
  Brain,
  Eye,
  ChevronRight,
  TrendingUp,
  BookOpen,
  GraduationCap,
  ArrowRight,
  BarChart,
} from "lucide-react";
import { ThemeLogo } from "@/components/layout/ThemeLogo";

export const metadata: Metadata = {
  title: "POLANITAS — Edukasi & Strategi Konten Digital Terintegrasi AI",
  description:
    "Platform interaktif untuk belajar analisis data, riset tren, dan strategi konten digital dengan praktik langsung menggunakan Multi-Agent AI & Eye Tracking.",
};

const FEATURES = [
  {
    Icon: Search,
    title: "1. Modul Riset: The Researcher",
    desc: "Belajar cara mengumpulkan dan membaca data tren dari YouTube, TikTok, dan Marketplace. Praktik menganalisis volume pencarian dan insight konsumen secara real-time.",
    tag: "Learn: Data Scraping",
    color: "#3B82F6",
  },
  {
    Icon: Brain,
    title: "2. Modul Strategi: The Strategist",
    desc: "Pahami kerangka berpikir copywriting viral. Latih kemampuan meracik hook dan skrip menggunakan metodologi Chain-of-Thought yang diadopsi dari Llama 3.3 70B.",
    tag: "Learn: Framework & CoT",
    color: "#8B5CF6",
  },
  {
    Icon: Eye,
    title: "3. Modul Analitik: The Analyst",
    desc: "Pelajari psikologi visual audiens. Gunakan WebGazer Eye Tracking untuk merekam fiksasi mata, membedah F-Pattern, dan memberikan rekomendasi UI/UX berbasis data.",
    tag: "Learn: User Behavior",
    color: "#22C55E",
  },
];

const HIGHLIGHTS = [
  { Icon: BookOpen,      label: "Kurikulum Interaktif",  desc: "Belajar dari data nyata" },
  { Icon: BarChart,      label: "Analisis Data",         desc: "Baca pola di balik metrik" },
  { Icon: Zap,           label: "Praktik Multi-Agent",   desc: "Eksekusi dengan Groq AI"  },
  { Icon: GraduationCap, label: "Tingkatkan Skill",      desc: "Menjadi analis konten PRO" },
];

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 40px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          position: "sticky",
          top: 0,
          zIndex: 99,
        }}
      >
        <ThemeLogo height={28} />

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="chip">Edukasi v1.0</span>
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            Mulai Belajar
            <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 60px",
          gap: 20,
        }}
        className="animate-fade-in-up"
      >
        {/* Labels */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
          <span className="status-badge status-done">Ruang Belajar Interaktif</span>
          <span className="chip">Analisis Data</span>
          <span className="chip">Praktik AI Marketing</span>
        </div>

        {/* Hero Logo */}
        <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}>
          <ThemeLogo height={42} />
        </div>

        {/* Headline */}
        <h1 style={{ maxWidth: 860, letterSpacing: "-0.02em" }}>
          Belajar Analisis Data & Strategi Konten{" "}
          <br />
          <span className="glow-text">Di Dunia Nyata Bersama AI</span>
        </h1>

        <p style={{ maxWidth: 640, fontSize: "1.0625rem" }}>
          POLANITAS bukan sekadar alat, tapi <strong>platform edukasi interaktif</strong>.
          Pelajari keterampilan menganalisis tren, merancang strategi komunikasi, dan membedah psikologi visual audiens dengan mempraktikkannya langsung bersama 3 Agen AI.
        </p>

        {/* Path Flow Text */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12, 
            marginTop: 4,
            padding: "10px 24px",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-text-secondary)"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-primary)" }}>
            <Search size={14} color="var(--color-accent-text)" /> 1. Pahami Tren
          </span>
          <ChevronRight size={14} color="var(--color-border-2)" />
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-primary)" }}>
            <Brain size={14} color="var(--color-accent-text)" /> 2. Rancang Strategi
          </span>
          <ChevronRight size={14} color="var(--color-border-2)" />
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-primary)" }}>
            <Eye size={14} color="var(--color-accent-text)" /> 3. Validasi Visual
          </span>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
          <Link
            href="/dashboard"
            className="btn btn-primary btn-lg"
            id="hero-cta-btn"
          >
            <Zap size={16} strokeWidth={2.5} />
            Mulai Praktik Gratis
          </Link>
          <a href="#features" className="btn btn-ghost btn-lg">
            Lihat Kurikulum
            <ChevronRight size={16} strokeWidth={2} />
          </a>
        </div>

        {/* Highlights row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginTop: 40,
            maxWidth: 860,
            width: "100%",
          }}
        >
          {HIGHLIGHTS.map(({ Icon, label, desc }) => (
            <div
              key={label}
              style={{
                padding: "14px 16px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                textAlign: "left",
              }}
            >
              <Icon size={18} strokeWidth={1.75} color="var(--color-accent-text)" style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)", marginBottom: 3 }}>
                {label}
              </div>
              <div className="caption">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section
        id="features"
        style={{ padding: "60px 40px", background: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2>Tiga Modul Praktik Komprehensif</h2>
            <p style={{ marginTop: 8, maxWidth: 580, margin: "8px auto 0" }}>
              Teori tidak cukup. Di setiap modul, kamu akan mengeksplorasi data metrik sungguhan
              sembari diiringi AI untuk memahami logika analitik dari awal hingga akhir.
            </p>
          </div>

          <div className="bento-grid">
            {FEATURES.map(({ Icon, title, desc, tag, color }) => (
              <div key={title} className="bento-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  className="agent-icon"
                  style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 6 }}>
                    {title}
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
                </div>
                <span className="chip" style={{ alignSelf: "flex-start" }}>
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section
        style={{
          padding: "80px 40px",
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ marginBottom: 16 }}>Paradigma Pembelajaran Data-Driven</h2>
          <p style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", lineHeight: 1.8, marginBottom: 24 }}>
            Di era AI, kreativitas saja tidak cukup tanpa data. Keterampilan menganalisis angka, memahami pergeseran audiens secara psikologis, dan menggunakan AI sebagai alat kolaborasi (bukan pengganti) adalah keahlian mutlak. Melalui POLANITAS, kamu didorong untuk menemukan pola (Pattern) dan menerapkannya menjadi aksi terukur.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-primary)", fontWeight: 600 }}>
              <Search size={16} color="var(--color-accent-text)" /> Riset
            </div>
            <span style={{ color: "var(--color-border-2)" }}>—</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-primary)", fontWeight: 600 }}>
              <TrendingUp size={16} color="var(--color-accent-text)" /> Analisis
            </div>
            <span style={{ color: "var(--color-border-2)" }}>—</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-primary)", fontWeight: 600 }}>
              <Zap size={16} color="var(--color-accent-text)" /> Eksekusi AI
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        style={{
          padding: "60px 40px",
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 12 }}>Siap Menjadi Analis & Ahli Strategi Konten?</h2>
        <p style={{ marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
          Masuk ke dashboard, jalankan modul simulasi, dan asah kemampuan analisis kamu menggunakan kasus nyata dari internet hari ini.
        </p>
        <Link href="/dashboard" className="btn btn-primary btn-lg">
          <GraduationCap size={16} strokeWidth={2.5} />
          Mulai Belajar Sekarang
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "20px 40px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--color-surface)",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>© 2026 POLANITAS. Platform Edukasi Open Source.</span>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="#" style={{ color: "var(--color-text-muted)" }}>Modul Pelatihan</a>
          <a href="#" style={{ color: "var(--color-text-muted)" }}>Panduan Praktik</a>
        </div>
      </footer>
    </div>
  );
}
