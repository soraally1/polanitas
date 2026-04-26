"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Clock,
  ChevronRight,
  Loader2,
  MapPin,
  CheckCircle,
  TrendingUp,
  ShoppingBag,
  Users,
  BarChart2,
  Hash,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase-client";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { startResearchSession } from "@/actions/agent-actions";
import { Session } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExtendedSession extends Session {
  platforms?: string[];
  researchFocus?: string;
  targetAudience?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "tiktok", label: "TikTok", color: "#010101" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "shopee", label: "Shopee", color: "#EE4D2D" },
  { id: "tokopedia", label: "Tokopedia", color: "#00AA5B" },
];

const FOCUS_OPTIONS = [
  { id: "trend-konten", label: "Tren Konten", desc: "Topik & format konten yang sedang naik", Icon: TrendingUp },
  { id: "whitespace-produk", label: "Whitespace Produk", desc: "Celah pasar dengan kompetisi rendah", Icon: ShoppingBag },
  { id: "analisis-kompetitor", label: "Analisis Kompetitor", desc: "Positioning & taktik pesaing", Icon: BarChart2 },
  { id: "strategi-hashtag", label: "Strategi Hashtag", desc: "Keywords & hashtag viral yang relevan", Icon: Hash },
  { id: "segmentasi-audiens", label: "Segmentasi Audiens", desc: "Pemetaan persona dan perilaku target", Icon: Users },
];

const REGIONS = [
  { code: "ID", label: "Indonesia" },
  { code: "MY", label: "Malaysia" },
  { code: "SG", label: "Singapura" },
  { code: "US", label: "Amerika Serikat" },
];

const STATUS_COLOR: Record<string, string> = {
  done: "var(--color-done)",
  running: "var(--color-running)",
  idle: "var(--color-idle)",
  error: "var(--color-error)",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Form state
  const [isPending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [regionCode, setRegionCode] = useState("ID");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "youtube"]);
  const [researchFocus, setResearchFocus] = useState("trend-konten");
  const [targetAudience, setTargetAudience] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Fetch sessions from Firestore
  useEffect(() => {
    if (authLoading || !user) {
      setLoadingSessions(false);
      return;
    }
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q,
      (snap) => { setSessions(snap.docs.map((d) => d.data() as ExtendedSession)); setLoadingSessions(false); },
      () => setLoadingSessions(false)
    );
    return () => unsub();
  }, [user, authLoading]);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    setSubmitError(null);
    setSuccessId(null);

    const fd = new FormData();
    fd.append("topic", topic.trim());
    fd.append("regionCode", regionCode);
    fd.append("platforms", JSON.stringify(selectedPlatforms));
    fd.append("researchFocus", researchFocus);
    if (targetAudience.trim()) fd.append("targetAudience", targetAudience.trim());

    startTransition(async () => {
      try {
        const res = await startResearchSession(fd);
        if (res?.error) {
          setSubmitError("Gagal memulai sesi. Periksa inputmu.");
        } else if (res?.sessionId) {
          setTopic("");
          setTargetAudience("");
          setSuccessId(res.sessionId);
        }
      } catch (err: any) {
        setSubmitError(err.message || "Terjadi kesalahan");
      }
    });
  }

  const canSubmit = topic.trim().length >= 3 && selectedPlatforms.length > 0 && !isPending;

  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 48, paddingBottom: 80 }}>

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>
          Sesi Riset
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem" }}>
          Konfigurasi parameter riset, lalu biarkan tiga agen AI bekerja paralel.
        </p>
      </div>

      {/* ── Form ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: 28 }}>

          {/* Block 1: Topik */}
          <div>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.875rem", marginBottom: 10, color: "var(--color-text-primary)" }}>
              Topik / Produk / Bisnis <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Brand skincare khusus kulit berminyak Gen Z"
              disabled={isPending}
              style={{
                width: "100%", padding: "16px 20px", borderRadius: 14, fontSize: "1rem",
                border: "1.5px solid var(--color-border)", background: "var(--color-surface)",
                color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
              }}
              onFocus={e => { e.target.style.borderColor = "#6366F1"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Block 2: Platform + Region */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "start" }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, fontSize: "0.875rem", marginBottom: 10, color: "var(--color-text-primary)" }}>
                Platform yang Diriset <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {PLATFORMS.map(({ id, label, color }) => {
                  const active = selectedPlatforms.includes(id);
                  return (
                    <button
                      key={id} type="button" onClick={() => togglePlatform(id)}
                      style={{
                        padding: "8px 18px", borderRadius: 100, fontSize: "0.875rem", fontWeight: 600,
                        border: active ? `1.5px solid ${color}` : "1.5px solid var(--color-border)",
                        background: active ? `${color}12` : "var(--color-surface)",
                        color: active ? color : "var(--color-text-muted)",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.15s", fontFamily: "var(--font-sans)",
                      }}
                    >
                      {active && <CheckCircle size={13} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region */}
            <div style={{ minWidth: 160 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.875rem", marginBottom: 10, color: "var(--color-text-primary)" }}>
                <MapPin size={14} /> Region
              </label>
              <select
                value={regionCode} onChange={(e) => setRegionCode(e.target.value)}
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: "0.9rem",
                  border: "1.5px solid var(--color-border)", background: "var(--color-surface)",
                  color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer",
                }}
              >
                {REGIONS.map(r => <option key={r.code} value={r.code}>{r.label} ({r.code})</option>)}
              </select>
            </div>
          </div>

          {/* Block 3: Fokus Riset */}
          <div>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.875rem", marginBottom: 10, color: "var(--color-text-primary)" }}>
              Fokus Riset
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {FOCUS_OPTIONS.map(({ id, label, desc, Icon }) => {
                const active = researchFocus === id;
                return (
                  <button
                    key={id} type="button" onClick={() => setResearchFocus(id)}
                    style={{
                      padding: "14px 16px", borderRadius: 14, textAlign: "left",
                      border: active ? "1.5px solid #6366F1" : "1.5px solid var(--color-border)",
                      background: active ? "rgba(99,102,241,0.06)" : "var(--color-surface)",
                      cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-sans)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Icon size={15} color={active ? "#6366F1" : "var(--color-text-muted)"} />
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: active ? "#6366F1" : "var(--color-text-primary)" }}>
                        {label}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.4 }}>
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Block 4: Target Audiens (optional) */}
          <div>
            <label style={{ display: "block", fontWeight: 700, fontSize: "0.875rem", marginBottom: 4, color: "var(--color-text-primary)" }}>
              Target Audiens <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>(opsional)</span>
            </label>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 10px" }}>
              Misal: Perempuan 18–25 tahun, urban, tertarik gaya hidup sehat
            </p>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Deskripsikan target pasarmu..."
              disabled={isPending}
              style={{
                width: "100%", padding: "13px 18px", borderRadius: 12, fontSize: "0.9375rem",
                border: "1.5px solid var(--color-border)", background: "var(--color-surface)",
                color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={e => { e.target.style.borderColor = "#6366F1"; }}
              onBlur={e => { e.target.style.borderColor = "var(--color-border)"; }}
            />
          </div>

          {/* Error / Success */}
          {submitError && (
            <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#DC2626", fontSize: "0.875rem", fontWeight: 600 }}>
              {submitError}
            </div>
          )}
          {successId && (
            <div style={{ padding: "12px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, color: "#15803D", fontSize: "0.875rem", fontWeight: 600 }}>
              ✓ Agen AI sedang berjalan! <Link href={`/dashboard/sessions/${successId}`} style={{ textDecoration: "underline", color: "inherit" }}>Pantau progres →</Link>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: "14px 32px", borderRadius: 12, background: canSubmit ? "var(--color-accent)" : "var(--color-surface-3)",
                color: canSubmit ? "#12200A" : "var(--color-text-muted)", fontWeight: 800, fontSize: "0.9375rem",
                border: "none", cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.2s", fontFamily: "var(--font-sans)",
                boxShadow: canSubmit ? "0 4px 16px var(--color-accent-glow)" : "none",
              }}
            >
              {isPending ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Agen Berjalan...</> : "Mulai Riset AI"}
            </button>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              {selectedPlatforms.length === 0 ? "Pilih minimal 1 platform" : `${selectedPlatforms.length} platform dipilih`}
            </span>
          </div>

        </div>
      </form>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "var(--color-border)" }} />

      {/* ── Riwayat Sesi ─────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", marginBottom: 20 }}>Riwayat Sesi</h2>

        {loadingSessions || authLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", background: "var(--color-surface)", border: "1.5px dashed var(--color-border)", borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderOpen size={24} color="var(--color-text-muted)" />
            </div>
            <p style={{ color: "var(--color-text-muted)", maxWidth: 360 }}>
              Belum ada sesi. Isi form di atas untuk memulai riset pertamamu bersama agen AI.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sessions.map((s) => {
              const agentStatuses = Object.values(s.agents).map((a) => a.status);
              const allDone = agentStatuses.every(st => st === "done");
              const hasRunning = agentStatuses.some(st => st === "running");
              const statusLabel = allDone ? "Selesai" : hasRunning ? "Berjalan" : "Menunggu";
              const statusBg = allDone ? "rgba(34,197,94,0.08)" : hasRunning ? "rgba(245,158,11,0.08)" : "var(--color-surface-2)";
              const statusTextColor = allDone ? "#15803D" : hasRunning ? "#B45309" : "var(--color-text-muted)";

              return (
                <Link key={s.id} href={`/dashboard/sessions/${s.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18,
                    padding: "20px 24px", display: "flex", alignItems: "center", gap: 20,
                    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-border-2)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >

                    {/* Status dot */}
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: allDone ? "var(--color-done)" : hasRunning ? "var(--color-running)" : "var(--color-idle)", flexShrink: 0, boxShadow: hasRunning ? "0 0 8px var(--color-running)" : "none", animation: hasRunning ? "pulse 1.5s infinite" : "none" }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.topic}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {s.platforms?.map(p => (
                          <span key={p} style={{ fontSize: "0.71rem", fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{p}</span>
                        ))}
                        {s.researchFocus && (
                          <span style={{ fontSize: "0.71rem", fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "rgba(99,102,241,0.08)", color: "#6366F1" }}>{FOCUS_OPTIONS.find(f => f.id === s.researchFocus)?.label ?? s.researchFocus}</span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "var(--color-text-muted)", flexShrink: 0 }}>
                      <Clock size={12} />
                      {timeAgo(s.createdAt)}
                    </div>

                    {/* Status badge */}
                    <div style={{ padding: "5px 14px", borderRadius: 100, background: statusBg, color: statusTextColor, fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                      {statusLabel}
                    </div>

                    <ChevronRight size={17} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }} />
    </div>
  );
}
