"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Brain,
  TrendingUp,
  BarChart2,
  BookOpen,
  Clock,
  PlayCircle,
  Zap,
  CheckCircle,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpRight,
  Target,
  Flame,
  ShoppingBag,
  MessageSquare,
  Layers,
  Shield,
  DollarSign,
  Lock,
  Users,
  FlaskConical,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface Course {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  level: string;
  gradient: string;
  Icon: React.FC<any>;
  lessons: number;
  duration: string;
  tag: string;
  href: string;
  available: boolean;
}

interface ActiveCourse {
  id: string;
  title: string;
  desc: string;
  progress: number;
  gradient: string;
  href: string;
  Icon: React.FC<any>;
}

// ── All 12 modules ───────────────────────────────────────────────────
const COURSES: Course[] = [
  { id: "ai-orchestration", num: 1, title: "Orkestrasi AI", subtitle: "Menjadi Dirigen jaringan agen", level: "Fundamental", gradient: "linear-gradient(140deg, #818CF8 0%, #6366F1 100%)", Icon: Brain, lessons: 6, duration: "3 jam", tag: "Populer", href: "/dashboard/learn/ai-orchestration", available: true },
  { id: "trend-signal", num: 2, title: "Deteksi Tren Dini", subtitle: "Sinyal tren TikTok sebelum viral", level: "Menengah", gradient: "linear-gradient(140deg, #F97316 0%, #EA580C 100%)", Icon: TrendingUp, lessons: 6, duration: "2.5 jam", tag: "Terbaru", href: "/dashboard/learn/trend-signal", available: true },
  { id: "marketplace-whitespace", num: 3, title: "Whitespace Marketplace", subtitle: "Celah pasar Shopee & Tokopedia", level: "Menengah", gradient: "linear-gradient(140deg, #34D399 0%, #10B981 100%)", Icon: ShoppingBag, lessons: 5, duration: "2 jam", tag: "Terbaru", href: "/dashboard/learn/marketplace-whitespace", available: true },
  { id: "eye-tracking", num: 4, title: "Eye Tracking Mastery", subtitle: "F-Pattern · WebGazer · Heatmap", level: "Lanjutan", gradient: "linear-gradient(140deg, #FBBF24 0%, #D97706 100%)", Icon: BarChart2, lessons: 9, duration: "4 jam", tag: "Lanjutan", href: "/dashboard/learn/eye-tracking", available: true },
  { id: "llm-copywriting", num: 5, title: "Copywriting LLM", subtitle: "1.000 variasi caption via Llama 3", level: "Menengah", gradient: "linear-gradient(140deg, #F472B6 0%, #DB2777 100%)", Icon: MessageSquare, lessons: 7, duration: "3 jam", tag: "Populer", href: "/dashboard/learn/llm-copywriting", available: true },
  { id: "content-atomization", num: 6, title: "Content Atomization", subtitle: "1 ide → Reels + TikTok + Live", level: "Menengah", gradient: "linear-gradient(140deg, #C084FC 0%, #7C3AED 100%)", Icon: Layers, lessons: 6, duration: "2.5 jam", tag: "Terbaru", href: "/dashboard/learn/content-atomization", available: true },
  { id: "neuromarketing", num: 7, title: "Neuromarketing", subtitle: "Dashboard untuk keputusan 30 detik", level: "Lanjutan", gradient: "linear-gradient(140deg, #F87171 0%, #DC2626 100%)", Icon: BarChart2, lessons: 7, duration: "3 jam", tag: "Lanjutan", href: "/dashboard/learn/neuromarketing", available: false },
  { id: "crisis-management", num: 8, title: "Manajemen Krisis", subtitle: "Respon sentimen otomatis & empati", level: "Lanjutan", gradient: "linear-gradient(140deg, #FB923C 0%, #C2410C 100%)", Icon: Shield, lessons: 5, duration: "2 jam", tag: "Lanjutan", href: "/dashboard/learn/crisis-management", available: false },
  { id: "roi-attribution", num: 9, title: "Atribusi ROI", subtitle: "Engagement → sales marketplace", level: "Lanjutan", gradient: "linear-gradient(140deg, #2DD4BF 0%, #0D9488 100%)", Icon: DollarSign, lessons: 8, duration: "3.5 jam", tag: "Lanjutan", href: "/dashboard/learn/roi-attribution", available: false },
  { id: "ai-ethics", num: 10, title: "Etika AI & Brand Safety", subtitle: "Guardrails · UU PDP · Compliance", level: "Fundamental", gradient: "linear-gradient(140deg, #94A3B8 0%, #475569 100%)", Icon: Lock, lessons: 5, duration: "2 jam", tag: "Fundamental", href: "/dashboard/learn/ai-ethics", available: false },
  { id: "influencer-dna", num: 11, title: "Influencer DNA Matching", subtitle: "Vibe matching dengan vector search", level: "Lanjutan", gradient: "linear-gradient(140deg, #D946EF 0%, #9333EA 100%)", Icon: Users, lessons: 6, duration: "2.5 jam", tag: "Lanjutan", href: "/dashboard/learn/influencer-dna", available: false },
  { id: "ab-testing", num: 12, title: "A/B Testing Agresif", subtitle: "50 variasi iklan · iterasi otomatis", level: "Lanjutan", gradient: "linear-gradient(140deg, #22D3EE 0%, #0891B2 100%)", Icon: FlaskConical, lessons: 7, duration: "3 jam", tag: "Lanjutan", href: "/dashboard/learn/ab-testing", available: false },
];

const ACTIVE_COURSES: ActiveCourse[] = [
  { id: "ai-orchestration", title: "Orkestrasi AI", desc: "Selesaikan teori Dirigen AI sebelum simulasi agen", progress: 33, gradient: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)", href: "/dashboard/learn/ai-orchestration", Icon: Brain },
  { id: "trend-signal", title: "Deteksi Tren Dini", desc: "Mulai deteksi noise vs. sinyal tren nyata", progress: 0, gradient: "linear-gradient(135deg, #FB923C 0%, #EA580C 100%)", href: "/dashboard/learn/trend-signal", Icon: TrendingUp },
];

const FILTERS = ["Semua", "Populer", "Terbaru", "Fundamental", "Menengah", "Lanjutan"];

// ─── Progress Ring ────────────────────────────────────────────────────
function Ring({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff" strokeWidth="4"
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
      {pct === 100
        ? <path d={`M ${size/2-5} ${size/2+1} L ${size/2-1} ${size/2+5} L ${size/2+6} ${size/2-4}`} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        : <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="10" fontWeight="800" fontFamily="var(--font-sans)">{pct}%</text>
      }
    </svg>
  );
}

// ─── Skeleton Components ──────────────────────────────────────────────
function SkeletonDashboard() {
  return (
    <div className="dashboard-grid">
      {/* Left */}
      <div className="dashboard-col dashboard-col--left">
        {/* greeting */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ width: 60, height: 14, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 180, height: 40, borderRadius: 8 }} />
          </div>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: "50%" }} />
        </div>
        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px 18px" }}>
              <div className="skeleton" style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", marginBottom: 10 }} />
              <div className="skeleton" style={{ width: 40, height: 24, borderRadius: 6, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        {/* search */}
        <div className="skeleton" style={{ height: 44, borderRadius: "var(--radius-lg)" }} />
        {/* cards row */}
        <div style={{ display: "flex", gap: 14, overflowX: "hidden" }}>
          {[0,1,2].map(i => (
            <div key={i} className="skeleton" style={{ minWidth: 200, height: 240, borderRadius: 22, flexShrink: 0 }} />
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="dashboard-col dashboard-col--right">
        <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 44, borderRadius: 100 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: 20 }} />
        {[0,1].map(i => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
        ))}
        <div className="skeleton" style={{ height: 80, borderRadius: 20 }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  if (loading) return <SkeletonDashboard />;

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Pengguna";
  const firstName = displayName.split(" ")[0];
  const avatarUrl = user?.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(firstName)}`;

  const filtered = COURSES.filter((c) => {
    const matchFilter = activeFilter === "Semua" || c.tag === activeFilter || c.level === activeFilter;
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="dashboard-grid">

      {/* ══ LEFT COLUMN ══════════════════════════════════════════════ */}
      <div className="dashboard-col dashboard-col--left">

        {/* Greeting */}
        <div className="animate-fade-in-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: 4, fontWeight: 500 }}>Halo,</p>
            <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", letterSpacing: "-0.04em", fontWeight: 800, lineHeight: 1.1, display: "flex", alignItems: "center", gap: 10 }}>
              {firstName} <span style={{ animation: "wave 2.5s infinite", transformOrigin: "70% 70%", display: "inline-block" }}>👋</span>
            </h1>
          </div>
          <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: "3px solid var(--color-surface)", boxShadow: "var(--shadow-md)", flexShrink: 0 }}>
            <img src={avatarUrl} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="animate-fade-in-up" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, animationDelay: "60ms" }}>
          {[
            { label: "Modul Tersedia", value: "12", Icon: BookOpen, color: "#6366F1" },
            { label: "Sedang Belajar", value: String(ACTIVE_COURSES.filter(c=>c.progress>0).length), Icon: Flame, color: "#F59E0B" },
            { label: "AI Tutor Lab", value: "Aktif", Icon: Zap, color: "#10B981" },
          ].map(({ label, value, Icon: I, color }) => (
            <div key={label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <I size={14} color={color} />
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-text-primary)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 4, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="animate-fade-in-up" style={{ display: "flex", gap: 10, animationDelay: "120ms" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={15} color="var(--color-text-muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text" placeholder="Cari modul pembelajaran..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "10px 14px 10px 38px", fontSize: "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", background: "var(--color-surface)", outline: "none", boxSizing: "border-box", boxShadow: "var(--shadow-sm)", transition: "border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = "#6366F1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "var(--shadow-sm)"; }}
            />
          </div>
          <button style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: "var(--color-accent)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px var(--color-accent-glow)", transition: "transform 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            <SlidersHorizontal size={16} color="#1A2E0A" />
          </button>
        </div>

        {/* Courses horizontal scroll */}
        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.05rem" }}>Kurikulum — 12 Modul</h2>
            <Link href="/dashboard/learn" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "var(--color-accent-text)", textDecoration: "none" }}>
              Lihat Semua <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {FILTERS.map(f => {
              const active = activeFilter === f;
              return (
                <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "6px 14px", borderRadius: 100, border: active ? "none" : "1px solid var(--color-border)", background: active ? "var(--color-accent)" : "var(--color-surface)", color: active ? "#12200A" : "var(--color-text-secondary)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: active ? "0 3px 10px var(--color-accent-glow)" : "var(--shadow-sm)", transition: "all 0.2s", fontFamily: "var(--font-sans)" }}>
                  {f}
                </button>
              );
            })}
          </div>

          {/* Horizontal scroll row */}
          <div
            style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingBottom: 12,
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border) transparent",
              scrollSnapType: "x mandatory",
            }}
          >
            {filtered.map(({ id, num, title, subtitle, level, gradient, Icon, lessons, duration, href, available }) => (
              <Link key={id} href={available ? href : "/dashboard/learn"} style={{ textDecoration: "none", flexShrink: 0, scrollSnapAlign: "start" }}>
                <div
                  style={{ background: gradient, borderRadius: 22, padding: "22px 20px 18px", width: 230, height: 250, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", opacity: available ? 1 : 0.65, cursor: "pointer", transition: "transform 0.22s ease, box-shadow 0.22s ease", filter: available ? "none" : "grayscale(25%)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 36px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* decorative blob */}
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ position: "absolute", right: -24, top: -24, opacity: 0.15, pointerEvents: "none" }}>
                    <circle cx="60" cy="60" r="60" fill="#fff" />
                    <circle cx="60" cy="60" r="36" fill="none" stroke="#fff" strokeWidth="2" />
                  </svg>

                  {/* num + level */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>#{String(num).padStart(2,"0")}</span>
                    {!available && <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.2)", padding: "2px 8px", borderRadius: 100 }}>Segera</span>}
                  </div>

                  {/* Icon */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={28} color="#FFF" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#FFF", marginBottom: 3, lineHeight: 1.3 }}>{title}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", marginBottom: 12, lineHeight: 1.4 }}>{subtitle}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: 100 }}>
                        <BookOpen size={10} /> {lessons}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: 100 }}>
                        <Clock size={10} /> {duration}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT COLUMN ═════════════════════════════════════════════ */}
      <div className="dashboard-col dashboard-col--right animate-fade-in-up" style={{ animationDelay: "240ms" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.05rem" }}>Modul Saya</h2>
          <Link href="/dashboard/learn" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "none" }}>
            Lihat Semua <ChevronRight size={13} />
          </Link>
        </div>

        {/* Tab pills */}
        <div style={{ display: "flex", padding: 4, borderRadius: 100, gap: 3, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
          {[{ i:BookOpen, l:"Semua" }, { i:Zap, l:"Berlangsung" }, { i:CheckCircle, l:"Selesai" }].map(({ i: Ti, l },idx) => (
            <button key={l} style={{ flex: 1, padding: "7px 8px", borderRadius: 100, border: "none", background: idx===0 ? "var(--color-accent)" : "transparent", color: idx===0 ? "#12200A" : "var(--color-text-muted)", fontWeight: idx===0 ? 700 : 500, fontSize: "0.72rem", display: "flex", justifyContent: "center", alignItems: "center", gap: 5, cursor: "pointer", boxShadow: idx===0 ? "0 3px 8px var(--color-accent-glow)" : "none", fontFamily: "var(--font-sans)" }}>
              <Ti size={12} /> {l}
            </button>
          ))}
        </div>

        {/* Promo banner */}
        <div style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", borderRadius: 18, padding: "20px 20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -16, top: -16, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", right: 16, top: 16, width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={24} color="rgba(255,255,255,0.65)" />
          </div>
          <div style={{ position: "relative", zIndex: 1, maxWidth: "72%" }}>
            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#FFF", lineHeight: 1.4, marginBottom: 12 }}>
              Mulai jalur belajar barumu!
            </div>
            <Link href="/dashboard/learn" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#FFF", color: "#1D4ED8", fontWeight: 700, fontSize: "0.75rem", padding: "7px 14px", borderRadius: 100, textDecoration: "none", boxShadow: "0 4px 10px rgba(0,0,0,0.15)", transition: "transform 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              Cek Kurikulum <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Active modules */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ACTIVE_COURSES.map(({ id, title, desc, progress, gradient, href, Icon: CourseIcon }) => (
            <Link key={id} href={href} style={{ textDecoration: "none" }}>
              <div
                style={{ background: gradient, borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden", transition: "transform 0.2s, filter 0.2s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "brightness(1)"; }}
              >
                <div style={{ position: "absolute", left: -16, top: -16, width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

                <div style={{ flex: 1, zIndex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.875rem", color: "#FFF", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.72)", marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{desc}</div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "#FFF", borderRadius: 999, transition: "width 0.8s ease" }} />
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
                    {progress === 0 ? "Belum dimulai" : `Selesai ${progress}%`}
                  </div>
                </div>

                <Ring pct={progress} size={48} />
              </div>
            </Link>
          ))}
        </div>

        {/* AI Agents CTA */}
        <div style={{ border: "1.5px dashed var(--color-border)", borderRadius: 18, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, background: "var(--color-surface)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--color-accent-subtle)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PlayCircle size={20} color="var(--color-accent-text)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.84rem", color: "var(--color-text-primary)", marginBottom: 2 }}>Simulasi Agen AI</div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>Selesaikan Modul 1 untuk membuka akses penuh.</div>
          </div>
          <Link href="/dashboard/sessions" className="btn btn-primary btn-sm" style={{ flexShrink: 0, gap: 4, padding: "7px 12px", fontSize: "0.72rem" }}>
            Mulai <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
