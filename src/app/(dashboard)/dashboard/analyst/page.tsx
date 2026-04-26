import type { Metadata } from "next";
import Link from "next/link";
import { BarChart2, ArrowUpRight, Zap, Database, Target, Map, TrendingUp, CheckSquare, FileBarChart } from "lucide-react";

export const metadata: Metadata = { title: "Analyst Agent — POLANITAS" };

const OUTPUTS = [
  {
    icon: Target,
    title: "Market Opportunity Score",
    desc: "Skor 0–100 yang mengukur seberapa besar peluang pasar topik riset berdasarkan volume tren, persaingan konten, dan whitespace yang tersedia.",
    color: "#6366F1",
  },
  {
    icon: TrendingUp,
    title: "Key Insights (5–7 poin)",
    desc: "Poin temuan terpenting dari kombinasi data riset dan strategi konten — disaring dari noise untuk hanya menyajikan sinyal yang actionable.",
    color: "#10B981",
  },
  {
    icon: Map,
    title: "Visual Blueprint per Platform",
    desc: "Gambaran detail tampilan konten: format video, deskripsi 3 detik pertama, palet warna, gaya tipografi, dan elemen visual kunci untuk setiap platform.",
    color: "#F59E0B",
  },
  {
    icon: CheckSquare,
    title: "Priority Matrix",
    desc: "Tabel platform mana yang harus didahulukan berdasarkan estimasi jangkauan, tingkat usaha (effort), dan deadline eksekusi.",
    color: "#8B5CF6",
  },
  {
    icon: FileBarChart,
    title: "Action Plan 3–5 Langkah",
    desc: "Rencana eksekusi berurutan dan spesifik: judul aksi, platform target, referensi ke viral hook dari Strategist, dan tenggat waktu.",
    color: "#EF4444",
  },
  {
    icon: FileBarChart,
    title: "Executive Summary",
    desc: "Ringkasan strategis 2–3 paragraf yang menghubungkan semua temuan menjadi arah konkret untuk kampanye konten.",
    color: "#06B6D4",
  },
];

const PROCESS_STEPS = [
  { num: "01", title: "Baca Output Researcher", desc: "Ambil ResearchOutput dari Firestore (/research/output): YouTube trends, social trends, marketplace products + AI keywords yang telah disintesis." },
  { num: "02", title: "Baca Output Strategist", desc: "Ambil StrategyOutput dari Firestore (/strategy/output): 3 skrip lengkap dengan viral hook, CTA, dan visual instructions." },
  { num: "03", title: "Bangun Konteks Gabungan", desc: "Kedua output dirangkum menjadi satu briefing komprehensif yang dikirim ke Llama 3.3 70B sebagai input analisis." },
  { num: "04", title: "AI Synthesis & Blueprint", desc: "Analyst AI (GROQ_API_KEY_DATA_ANALYTICS) menganalisis semua data dan menghasilkan FinalAnalysisReport lengkap dalam satu response JSON." },
  { num: "05", title: "Simpan & Selesai", desc: "Report disimpan ke Firestore (/analysis/output). Status semua agen berubah menjadi 'done' dan user dapat mengakses hasil riset penuh." },
];

export default function AnalystPage() {
  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 40, paddingBottom: 64 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={18} color="#6366F1" />
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Agen 03</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 }}>
            The Analyst
          </h1>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: 580, lineHeight: 1.7, fontSize: "1rem" }}>
            Membaca output dari Researcher dan Strategist, lalu mensintesisnya menjadi laporan analisis menyeluruh: market opportunity score, visual blueprint per platform, priority matrix, dan action plan siap eksekusi.
          </p>
        </div>
        <Link href="/dashboard/sessions" style={{ textDecoration: "none" }}>
          <div className="btn btn-primary" style={{ gap: 6, fontSize: "0.875rem" }}>
            Lihat Hasil <ArrowUpRight size={15} />
          </div>
        </Link>
      </div>

      {/* ── Capabilities ──────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { icon: Zap, label: "Groq Llama 3.3 70B — GROQ_API_KEY_DATA_ANALYTICS" },
          { icon: Database, label: "Baca 2 Output Sebelumnya + Syntax Analysis" },
          { icon: Database, label: "Output ke Firestore /analysis/output" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            <Icon size={13} color="#6366F1" />
            {label}
          </div>
        ))}
      </div>

      {/* ── Output types grid ─────────────────────────────────── */}
      <div>
        <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", marginBottom: 16 }}>Yang Dihasilkan</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {OUTPUTS.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: "20px 20px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: 8 }}>{title}</div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Process ────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", marginBottom: 16 }}>Cara Kerja</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {PROCESS_STEPS.map((step, i) => (
            <div key={step.num} style={{ display: "flex", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.75rem", color: "#6366F1" }}>{step.num}</div>
                {i < PROCESS_STEPS.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--color-border)", margin: "4px 0", minHeight: 32 }} />}
              </div>
              <div style={{ paddingBottom: 32, paddingTop: 8 }}>
                <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: 6 }}>{step.title}</div>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Visual Blueprint preview ───────────────────────────── */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Map size={16} color="#6366F1" />
          <span style={{ fontWeight: 800, fontSize: "0.9375rem" }}>Contoh Output: Visual Blueprint</span>
          <span style={{ marginLeft: "auto", fontSize: "0.72rem", padding: "3px 10px", borderRadius: 100, background: "rgba(99,102,241,0.08)", color: "#6366F1", fontWeight: 700 }}>Platform: TikTok</span>
        </div>
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { label: "Format", value: "Video vertikal 9:16, durasi 15–30 detik" },
            { label: "Opening Frame (3 detik)", value: "Close-up wajah + teks hook melayang dari bawah" },
            { label: "Gaya Tipografi", value: "Bold sans-serif, kontras tinggi, ukuran 36–48px" },
            { label: "Elemen Visual Kunci", value: "Produk di tengah · Tangan model · Sebelum-sesudah" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", lineHeight: 1.4 }}>{value}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Palet Warna</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["#F472B6", "#FBBF24", "#FFFFFF"].map(c => (
                <div key={c} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: "2px solid var(--color-border)" }} title={c} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Estimasi CTR</div>
            <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#6366F1", lineHeight: 1 }}>3.5–5.2%</div>
          </div>
        </div>
        <div style={{ padding: "12px 24px", background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border)", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
          Blueprint ini dihasilkan khusus per topik dan platform berdasarkan data riset nyata, bukan template generik.
        </div>
      </div>

    </div>
  );
}
