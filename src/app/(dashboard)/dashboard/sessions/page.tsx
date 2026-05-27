"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Clock,
  ChevronRight,
  Plus,
  TrendingUp,
  ShoppingBag,
  Users,
  BarChart2,
  Hash,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase-client";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Session } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExtendedSession extends Session {
  platforms?: string[];
  researchFocus?: string;
  targetAudience?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FOCUS_OPTIONS = [
  { id: "trend-konten", label: "Tren Konten", desc: "Topik & format konten yang sedang naik", Icon: TrendingUp },
  { id: "whitespace-produk", label: "Whitespace Produk", desc: "Celah pasar dengan kompetisi rendah", Icon: ShoppingBag },
  { id: "analisis-kompetitor", label: "Analisis Kompetitor", desc: "Positioning & taktik pesaing", Icon: BarChart2 },
  { id: "strategi-hashtag", label: "Strategi Hashtag", desc: "Keywords & hashtag viral yang relevan", Icon: Hash },
  { id: "segmentasi-audiens", label: "Segmentasi Audiens", desc: "Pemetaan persona dan perilaku target", Icon: Users },
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

  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Fetch sessions from Firestore
  useEffect(() => {
    // Auth still loading — keep the loading skeleton; do nothing yet
    if (authLoading) return;

    // Auth done, but no user → show empty state
    if (!user) {
      setLoadingSessions(false);
      return;
    }

    // Auth done + user present → subscribe to Firestore
    setLoadingSessions(true);
    setFirestoreError(null);
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
      (err) => {
        console.error("[Sessions] Firestore error:", err);
        setFirestoreError(err.message);
        setLoadingSessions(false);
      }
    );
    return () => unsub();
  }, [user, authLoading]);

  // Derived stats
  const stats = useMemo(() => {
    const total = sessions.length;
    const done = sessions.filter((s) =>
      Object.values(s.agents || {}).every((a: any) => a.status === "done")
    ).length;
    const running = sessions.filter((s) =>
      Object.values(s.agents || {}).some((a: any) => a.status === "running")
    ).length;
    const waiting = total - done - running;
    return { total, done, running, waiting };
  }, [sessions]);

  return (
    <div className="animate-fade-in-up flex flex-col gap-8 pb-20">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-[-0.04em] mb-2 leading-tight">
            Hasil Riset
          </h1>
          <p className="text-secondary text-base">
            Daftar seluruh sesi analisis pasar dan konten yang telah dijalankan.
          </p>
        </div>
        <Link href="/dashboard/sessions/new" className="no-underline">
          <button className="btn btn-primary shrink-0 gap-1.5 py-3 px-5 font-bold text-sm">
            <Plus size={16} strokeWidth={2.5} /> Mulai Riset Baru
          </button>
        </Link>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      {!loadingSessions && !authLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Sesi", value: stats.total, Icon: FileText, color: "#6366F1" },
            { label: "Selesai", value: stats.done, Icon: CheckCircle2, color: "#10B981" },
            { label: "Berjalan", value: stats.running, Icon: Loader2, color: "#F59E0B" },
            { label: "Menunggu", value: stats.waiting, Icon: Clock, color: "#94A3B8" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-surface border border-border rounded-[16px] p-4 flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Riwayat Sesi ─────────────────────────────────────────────── */}
      <div className="bento-card">
        <h2 className="font-extrabold text-[1.0625rem] mb-5">Riwayat Sesi Analisis</h2>

        {loadingSessions || authLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : firestoreError ? (
          <div className="py-10 px-6 text-center flex flex-col items-center gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--color-error, #EF4444)" }}>
              Gagal memuat sesi: {firestoreError}
            </p>
            <p className="text-xs text-muted max-w-sm">
              Coba refresh halaman. Jika masih gagal, periksa koneksi internet atau hubungi support.
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 px-6 text-center bg-surface border-[1.5px] border-dashed border-border rounded-[20px] flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <FolderOpen size={24} className="text-muted" />
            </div>
            <p className="text-muted text-sm max-w-[360px]">
              Belum ada sesi analisis. Klik tombol di atas untuk memulai riset pertamamu bersama agen AI.
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
                  <div className="bg-surface-2 border border-border rounded-[18px] py-5 px-6 flex items-center gap-5 transition-all hover:border-border-2 hover:-translate-y-0.5 hover:shadow-md">

                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${allDone ? "bg-done" : hasRunning ? "bg-running shadow-[0_0_8px_var(--color-running)] animate-pulse" : "bg-idle"
                      }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-[0.9375rem] text-primary mb-1 truncate">
                        {s.topic}
                      </div>
                      <div className="flex gap-2.5 flex-wrap">
                        {s.platforms?.map(p => (
                          <span key={p} className="text-[0.71rem] font-semibold py-0.5 px-2 rounded-full bg-surface-3 border border-border text-muted capitalize">{p}</span>
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
