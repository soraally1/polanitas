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
      (snap) => { 
        setSessions(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ExtendedSession))); 
        setLoadingSessions(false); 
      },
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
    <div className="animate-fade-in-up flex flex-col gap-12 pb-20">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] mb-2 leading-tight">
          Sesi Riset
        </h1>
        <p className="text-secondary text-base">
          Konfigurasi parameter riset, lalu biarkan tiga agen AI bekerja paralel.
        </p>
      </div>

      {/* ── Form ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-7">

          {/* Block 1: Topik */}
          <div>
            <label className="block font-bold text-[0.875rem] mb-2.5 text-primary">
              Topik / Produk / Bisnis <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Brand skincare khusus kulit berminyak Gen Z"
              disabled={isPending}
              className="w-full p-4 rounded-xl text-base border border-border bg-surface text-primary outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all font-sans"
            />
          </div>

          {/* Block 2: Platform + Region */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-7 items-start">
            <div>
              <label className="block font-bold text-[0.875rem] mb-2.5 text-primary">
                Platform yang Diriset <span className="text-error">*</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {PLATFORMS.map(({ id, label, color }) => {
                  const active = selectedPlatforms.includes(id);
                  return (
                    <button
                      key={id} type="button" onClick={() => togglePlatform(id)}
                      className={`py-2 px-4.5 rounded-full text-[0.875rem] font-semibold flex items-center gap-1.5 transition-all border font-sans ${
                        active 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border bg-surface text-muted"
                      }`}
                    >
                      {active && <CheckCircle size={13} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Region */}
            <div className="min-w-[160px]">
              <label className="flex items-center gap-1.5 font-bold text-[0.875rem] mb-2.5 text-primary">
                <MapPin size={14} /> Region
              </label>
              <select
                value={regionCode} onChange={(e) => setRegionCode(e.target.value)}
                className="w-full py-2.5 px-4 rounded-[10px] text-[0.9rem] border border-border bg-surface text-primary outline-none cursor-pointer font-sans"
              >
                {REGIONS.map(r => <option key={r.code} value={r.code}>{r.label} ({r.code})</option>)}
              </select>
            </div>
          </div>

          {/* Block 3: Fokus Riset */}
          <div>
            <label className="block font-bold text-[0.875rem] mb-2.5 text-primary">
              Fokus Riset
            </label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
              {FOCUS_OPTIONS.map(({ id, label, desc, Icon }) => {
                const active = researchFocus === id;
                return (
                  <button
                    key={id} type="button" onClick={() => setResearchFocus(id)}
                    className={`p-4 rounded-xl text-left transition-all border font-sans ${
                      active ? "border-[#6366F1] bg-[#6366F1]/5" : "border-border bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={15} className={active ? "text-[#6366F1]" : "text-muted"} />
                      <span className={`font-bold text-[0.875rem] ${active ? "text-[#6366F1]" : "text-primary"}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-[0.78rem] text-muted leading-tight m-0">
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Block 4: Target Audiens (optional) */}
          <div>
            <label className="block font-bold text-[0.875rem] mb-1 text-primary">
              Target Audiens <span className="text-muted font-normal">(opsional)</span>
            </label>
            <p className="text-[0.8rem] text-muted mb-2.5">
              Misal: Perempuan 18–25 tahun, urban, tertarik gaya hidup sehat
            </p>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Deskripsikan target pasarmu..."
              disabled={isPending}
              className="w-full py-3 px-4.5 rounded-xl text-[0.9375rem] border border-border bg-surface text-primary outline-none focus:border-[#6366F1] transition-all font-sans"
            />
          </div>

          {/* Error / Success */}
          {submitError && (
            <div className="py-3 px-4 bg-error/10 border border-error/20 rounded-xl text-error text-[0.875rem] font-semibold">
              {submitError}
            </div>
          )}
          {successId && (
            <div className="py-3 px-4 bg-done/10 border border-done/25 rounded-xl text-done text-[0.875rem] font-semibold">
              ✓ Agen AI sedang berjalan! <Link href={`/dashboard/sessions/${successId}`} className="underline">Pantau progres →</Link>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`py-3.5 px-8 rounded-xl font-extrabold text-[0.9375rem] flex items-center gap-2 transition-all font-sans border-none cursor-pointer ${
                canSubmit 
                ? "bg-accent text-[#12200A] shadow-[0_4px_16px_var(--color-accent-glow)]" 
                : "bg-surface-3 text-muted cursor-not-allowed"
              }`}
            >
              {isPending ? <><Loader2 size={18} className="animate-spin" /> Agen Berjalan...</> : "Mulai Riset AI"}
            </button>
            <span className="text-[0.8125rem] text-muted">
              {selectedPlatforms.length === 0 ? "Pilih minimal 1 platform" : `${selectedPlatforms.length} platform dipilih`}
            </span>
          </div>

        </div>
      </form>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="h-px bg-border" />

      {/* ── Riwayat Sesi ─────────────────────────────────────────────── */}
      <div>
        <h2 className="font-extrabold text-[1.0625rem] mb-5">Riwayat Sesi</h2>

        {loadingSessions || authLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 px-6 text-center bg-surface border-[1.5px] border-dashed border-border rounded-[20px] flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <FolderOpen size={24} className="text-muted" />
            </div>
            <p className="text-muted text-sm max-w-[360px]">
              Belum ada sesi. Isi form di atas untuk memulai riset pertamamu bersama agen AI.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => {
              const agentStatuses = Object.values(s.agents || {}).map((a: any) => a.status);
              const allDone = agentStatuses.length > 0 && agentStatuses.every(st => st === "done");
              const hasRunning = agentStatuses.some(st => st === "running");
              const statusLabel = allDone ? "Selesai" : hasRunning ? "Berjalan" : "Menunggu";
              const statusBg = allDone ? "bg-done/10" : hasRunning ? "bg-running/10" : "bg-surface-2";
              const statusTextColor = allDone ? "text-done" : hasRunning ? "text-running" : "text-muted";

              return (
                <Link key={s.id} href={`/dashboard/sessions/${s.id}`} className="no-underline">
                  <div className="bg-surface border border-border rounded-[18px] py-5 px-6 flex items-center gap-5 transition-all hover:border-border-2 hover:-translate-y-0.5 hover:shadow-md">

                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      allDone ? "bg-done" : hasRunning ? "bg-running shadow-[0_0_8px_var(--color-running)] animate-pulse" : "bg-idle"
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-[0.9375rem] text-primary mb-1 truncate">
                        {s.topic}
                      </div>
                      <div className="flex gap-2.5 flex-wrap">
                        {s.platforms?.map(p => (
                          <span key={p} className="text-[0.71rem] font-semibold py-0.5 px-2 rounded-full bg-surface-2 border border-border text-muted capitalize">{p}</span>
                        ))}
                        {s.researchFocus && (
                          <span className="text-[0.71rem] font-semibold py-0.5 px-2 rounded-full bg-[#6366F1]/10 text-[#6366F1]">{FOCUS_OPTIONS.find(f => f.id === s.researchFocus)?.label ?? s.researchFocus}</span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 text-[0.78rem] text-muted flex-shrink-0">
                      <Clock size={12} />
                      {timeAgo(s.createdAt)}
                    </div>

                    {/* Status badge */}
                    <div className={`py-1 px-3.5 rounded-full text-[0.78rem] font-bold flex-shrink-0 ${statusBg} ${statusTextColor}`}>
                      {statusLabel}
                    </div>

                    <ChevronRight size={17} className="text-muted flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
