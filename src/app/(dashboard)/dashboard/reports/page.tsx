"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart2, TrendingUp, FileText, Eye, Download, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/firebase-client";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Session } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExtendedSession extends Session {
  platforms?: string[];
  researchFocus?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function getMonthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "Mei", "06": "Jun", "07": "Jul", "08": "Agu",
  "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
};

const BAR_MAX_DEFAULT = 10;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ExtendedSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [firestoreError, setFirestoreError] = useState<string | null>(null);

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
    setFirestoreError(null);
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSessions(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ExtendedSession)));
        setLoading(false);
      },
      (err) => {
        console.error("[Reports] Firestore error:", err);
        setFirestoreError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, authLoading]);


  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = sessions.length;
    const done = sessions.filter((s) =>
      Object.values(s.agents || {}).every((a: any) => a.status === "done")
    ).length;
    const running = sessions.filter((s) =>
      Object.values(s.agents || {}).some((a: any) => a.status === "running")
    ).length;
    // Each completed session produced 3 scripts (from strategist)
    const scripts = done * 3;

    return { total, done, running, scripts };
  }, [sessions]);

  // ── Monthly chart data (last 5 months) ────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; year: number; month: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: MONTH_LABELS[String(d.getMonth() + 1).padStart(2, "0")],
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      });
    }

    return months.map(({ key, label }) => {
      const inMonth = sessions.filter((s) => getMonthKey(s.createdAt) === key);
      const doneSessions = inMonth.filter((s) =>
        Object.values(s.agents || {}).every((a: any) => a.status === "done")
      );
      return {
        month: label,
        sessions: inMonth.length,
        scripts: doneSessions.length * 3,
      };
    });
  }, [sessions]);

  const BAR_MAX = Math.max(BAR_MAX_DEFAULT, ...monthlyData.map((d) => d.scripts));

  // ── Recent 5 sessions ─────────────────────────────────────────────────────
  const recentSessions = sessions.slice(0, 5);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="animate-fade-in-up">
        <div className="page-header">
          <div><h1>Reports</h1></div>
        </div>
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton" style={{ height: 96 }} />
          ))}
        </div>
        <div className="bento-card skeleton" style={{ height: 220, marginBottom: 20 }} />
        <div className="bento-card skeleton" style={{ height: 180 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p style={{ marginTop: 4 }}>Ringkasan performa dan output seluruh sesi riset kamu</p>
        </div>
        <button
          id="export-report-btn"
          className="btn btn-secondary"
          onClick={() => {
            const csv = [
              ["Topik", "Status", "Skrip", "Dibuat"].join(","),
              ...recentSessions.map((s) => {
                const allDone = Object.values(s.agents || {}).every((a: any) => a.status === "done");
                const hasRunning = Object.values(s.agents || {}).some((a: any) => a.status === "running");
                const status = allDone ? "Selesai" : hasRunning ? "Berjalan" : "Menunggu";
                return [
                  `"${s.topic}"`,
                  status,
                  allDone ? 3 : 0,
                  new Date(s.createdAt).toLocaleDateString("id-ID"),
                ].join(",");
              }),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "polanitas-report.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={14} strokeWidth={2} />
          Export CSV
        </button>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Sesi", value: stats.total, Icon: FileText, sub: `${stats.done} selesai` },
          { label: "Skrip Dibuat", value: stats.scripts, Icon: BarChart2, sub: `dari ${stats.done} sesi selesai` },
          { label: "Sedang Berjalan", value: stats.running, Icon: Eye, sub: stats.running > 0 ? "agen aktif" : "tidak ada" },
          {
            label: "Tingkat Selesai",
            value: stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}%` : "—",
            Icon: TrendingUp,
            sub: `${stats.done} dari ${stats.total} sesi`,
          },
        ].map(({ label, value, Icon, sub }) => (
          <div key={label} className="stat-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="agent-icon" style={{ width: 32, height: 32, borderRadius: 6 }}>
                <Icon size={14} strokeWidth={1.75} />
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  padding: "2px 8px",
                  background: "var(--color-surface-2)",
                  borderRadius: 999,
                  maxWidth: 120,
                  textAlign: "right",
                  lineHeight: 1.4,
                }}
              >
                {sub}
              </span>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1, marginBottom: 4 }}>
              {value}
            </div>
            <div className="caption">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Bar chart — sesi per bulan ────────────────────────────────────── */}
      <div className="bento-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <BarChart2 size={16} strokeWidth={1.75} color="var(--color-accent-text)" />
          <h3 style={{ margin: 0 }}>Aktivitas per Bulan (5 bulan terakhir)</h3>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Sesi", color: "var(--color-accent-text)" },
            { label: "Skrip", color: "#8B5CF6" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
        </div>

        {stats.total === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Belum ada data sesi untuk ditampilkan
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${monthlyData.length}, 1fr)`, gap: 16, alignItems: "end" }}>
            {monthlyData.map((d) => (
              <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120 }}>
                  {[
                    { value: d.sessions, color: "var(--color-accent-text)" },
                    { value: d.scripts, color: "#8B5CF6" },
                  ].map(({ value, color }, bi) => (
                    <div
                      key={bi}
                      style={{
                        width: 18,
                        height: value === 0 ? 4 : `${(value / BAR_MAX) * 100}%`,
                        background: color,
                        borderRadius: "4px 4px 0 0",
                        opacity: value === 0 ? 0.2 : 0.85,
                        minHeight: 4,
                        transition: "height 0.4s ease",
                      }}
                      title={`${value}`}
                    />
                  ))}
                </div>
                <span className="caption">{d.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent sessions table ─────────────────────────────────────────── */}
      <div className="bento-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Sesi Terbaru</h3>
          <Link href="/dashboard/sessions" style={{ fontSize: "0.8125rem", color: "var(--color-accent-text)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Belum ada sesi. <Link href="/dashboard/sessions/new" style={{ color: "var(--color-accent-text)" }}>Mulai riset pertama →</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: "none", boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Topik</th>
                  <th>Skrip</th>
                  <th>Waktu</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => {
                  const agents = Object.values(s.agents || {}) as any[];
                  const allDone = agents.length > 0 && agents.every((a) => a.status === "done");
                  const hasRunning = agents.some((a) => a.status === "running");
                  const statusKey = allDone ? "done" : hasRunning ? "running" : "idle";
                  const statusLabel = allDone ? "Selesai" : hasRunning ? "Berjalan" : "Menunggu";

                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, maxWidth: 260 }}>
                        <Link href={`/dashboard/sessions/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.topic}
                          </span>
                        </Link>
                      </td>
                      <td>{allDone ? 3 : 0}</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                          <Clock size={11} />
                          {timeAgo(s.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${statusKey}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
