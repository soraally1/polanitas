"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Loader2,
  MapPin,
  CheckCircle,
  TrendingUp,
  ShoppingBag,
  Users,
  BarChart2,
  Hash,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { startResearchSession } from "@/actions/agent-actions";
import { useSpeechFormFill } from "@/hooks/use-speech-form-fill";

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

export default function NewSessionPage() {
  const router = useRouter();

  // Form state
  const [isPending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [regionCode, setRegionCode] = useState("ID");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "youtube"]);
  const [researchFocus, setResearchFocus] = useState("trend-konten");
  const [targetAudience, setTargetAudience] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useSpeechFormFill((action) => {
    switch (action.type) {
      case "set-topic":
        setTopic(action.value);
        break;
      case "set-audience":
        setTargetAudience(action.value);
        break;
      case "set-region":
        setRegionCode(action.code);
        break;
      case "toggle-platform":
        togglePlatform(action.platform);
        break;
      case "set-platforms":
        setSelectedPlatforms(action.platforms);
        break;
      case "set-focus":
        setResearchFocus(action.focusId);
        break;
      case "submit-form":
        formRef.current?.requestSubmit();
        break;
    }
  });

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
        if (res && 'error' in res) {
          const err = res.error as any;
          setSubmitError(typeof err === 'string' ? err : (err._ || "Gagal memulai sesi. Periksa inputmu."));
        } else if (res && 'sessionId' in res) {
          setTopic("");
          setTargetAudience("");
          setSuccessId(res.sessionId as string);
          // Redirect immediately to session detail page
          router.push(`/dashboard/sessions/${res.sessionId}`);
        }
      } catch (err: any) {
        setSubmitError(err.message || "Terjadi kesalahan");
      }
    });
  }

  const canSubmit = topic.trim().length >= 3 && selectedPlatforms.length > 0 && !isPending;

  return (
    <div className="animate-fade-in-up flex flex-col gap-8 pb-20">
      
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Link href="/dashboard/sessions" className="flex items-center gap-1.5 text-muted hover:text-primary no-underline transition-colors text-sm font-semibold">
          <ArrowLeft size={16} /> Kembali ke Hasil Riset
        </Link>
        <div>
          <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] mb-2 leading-tight">
            Mulai Riset Baru
          </h1>
          <p className="text-secondary text-base">
            Konfigurasi parameter riset, lalu biarkan tiga agen AI bekerja paralel.
          </p>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────────── */}
      <form ref={formRef} onSubmit={handleSubmit} className="bento-card">
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
                {PLATFORMS.map(({ id, label }) => {
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
              ✓ Sesi berhasil diluncurkan! Mengalihkan ke pemantau progres...
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
              {isPending ? <><Loader2 size={18} className="animate-spin" /> Agen Berjalan...</> : <><Zap size={18} /> Mulai Riset AI</>}
            </button>
            <span className="text-[0.8125rem] text-muted">
              {selectedPlatforms.length === 0 ? "Pilih minimal 1 platform" : `${selectedPlatforms.length} platform dipilih`}
            </span>
          </div>

        </div>
      </form>
    </div>
  );
}
