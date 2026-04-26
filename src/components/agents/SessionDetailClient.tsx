"use client";

import { useAgentSync } from "@/hooks/use-agent-sync";
import AgentStatusPanel from "./AgentStatusPanel";
import EyeTrackingPanel from "./EyeTrackingPanel";
import { ContentScript } from "@/types";
import {
  BarChart2,
  Play,
  ShoppingBag,
  Hash,
  Megaphone,
  Clock,
  Tag,
} from "lucide-react";

interface SessionDetailClientProps {
  sessionId: string;
}

export default function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const { session, research, strategy, analytics, isLoading } = useAgentSync(sessionId);

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="skeleton" style={{ height: 72, borderRadius: "var(--radius-lg)" }} />
        <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bento-card" style={{ textAlign: "center", padding: 56 }}>
        <h3>Sesi tidak ditemukan</h3>
        <p style={{ marginTop: 8 }}>Session ID: {sessionId}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fade-in-up">

      {/* Session header */}
      <div className="page-header">
        <div>
          <div className="caption" style={{ marginBottom: 6 }}>
            SESSION · {session.id.substring(0, 8).toUpperCase()}
          </div>
          <h1>{session.topic}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="chip">{session.regionCode}</span>
          <span className="chip">
            <Clock size={10} strokeWidth={2} />
            {new Date(session.createdAt).toLocaleDateString("id-ID")}
          </span>
        </div>
      </div>

      {/* Agent status real-time */}
      <AgentStatusPanel sessionId={sessionId} />

      {/* Research output */}
      {research && (
        <div className="bento-card animate-fade-in-up">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <BarChart2 size={18} strokeWidth={1.75} color="var(--color-accent-text)" />
            <h3 style={{ margin: 0 }}>Hasil Riset</h3>
          </div>

          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <StatCard label="YouTube Trends" value={research.youtubeTrends.length} Icon={Play} />
            <StatCard label="Social Trends"  value={research.socialTrends.length}  Icon={Hash} />
            <StatCard label="Marketplace"    value={research.marketplaceProducts.length} Icon={ShoppingBag} />
          </div>

          {research.youtubeTrends.length > 0 && (
            <>
              <div className="caption" style={{ marginBottom: 10 }}>Top YouTube Trends</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {research.youtubeTrends.slice(0, 4).map((v) => (
                  <div
                    key={v.videoId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      background: "var(--color-surface-2)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-surface-3)",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Play size={13} strokeWidth={2} color="var(--color-accent-text)" fill="var(--color-accent-text)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {v.title}
                      </div>
                      <div className="caption">
                        {v.channelTitle} · {Number(v.viewCount).toLocaleString()} views
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Strategy output */}
      {strategy && (
        <div className="bento-card animate-fade-in-up">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Megaphone size={18} strokeWidth={1.75} color="var(--color-accent-text)" />
            <h3 style={{ margin: 0 }}>Strategi Konten</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {strategy.scripts.map((script: ContentScript, i) => (
              <ScriptCard key={i} script={script} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Eye tracking */}
      {strategy && strategy.scripts.length > 0 && (
        <EyeTrackingPanel
          sessionId={sessionId}
          scripts={strategy.scripts}
          analytics={analytics}
        />
      )}
    </div>
  );
}

/* ---- Sub-components ---- */

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <div className="stat-card">
      <div className="agent-icon" style={{ width: 32, height: 32, marginBottom: 10, borderRadius: 6 }}>
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--color-accent-text)",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div className="caption">{label}</div>
    </div>
  );
}

const DURATION_COLORS: Record<string, string> = {
  "15s": "#F59E0B",
  "30s": "#8B5CF6",
  "60s": "#3B82F6",
};

function ScriptCard({ script, index }: { script: ContentScript; index: number }) {
  const accentColor = DURATION_COLORS[script.duration] ?? "var(--color-text-muted)";

  return (
    <div className="script-card">
      <div className="script-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="caption">Skrip {String(index + 1).padStart(2, "0")}</span>
          <span
            style={{
              padding: "2px 9px",
              borderRadius: 999,
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: accentColor,
              background: `${accentColor}18`,
              fontFamily: "var(--font-sans)",
            }}
          >
            {script.duration}
          </span>
        </div>
        <span className="chip">
          <Tag size={10} strokeWidth={2} />
          {script.copywritingType}
        </span>
      </div>

      <div className="script-body">
        {/* Viral hook */}
        <div className="hook-box">
          <div className="caption" style={{ color: "var(--color-accent-text)", marginBottom: 5 }}>
            Viral Hook
          </div>
          <div
            style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", lineHeight: 1.4 }}
          >
            &ldquo;{script.viralHook}&rdquo;
          </div>
        </div>

        {/* Script */}
        <div>
          <div className="label">Skrip</div>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.75 }}>{script.script}</p>
        </div>

        {/* CTA */}
        <div>
          <div className="label">Call to Action</div>
          <p style={{ fontSize: "0.875rem" }}>{script.callToAction}</p>
        </div>

        {/* Hashtags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {script.hashtags.map((tag) => (
            <span key={tag} className="chip">
              <Hash size={10} strokeWidth={2} />
              {tag.replace(/^#/, "")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
