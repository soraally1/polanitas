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
      <div className="flex flex-col gap-4">
        <div className="skeleton h-[72px] rounded-[var(--radius-lg)]" />
        <div className="skeleton h-[260px] rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bento-card text-center p-14">
        <h3>Sesi tidak ditemukan</h3>
        <p className="mt-2">Session ID: {sessionId}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">

      {/* Session header */}
      <div className="page-header">
        <div>
          <div className="caption mb-1.5">
            SESSION · {session.id.substring(0, 8).toUpperCase()}
          </div>
          <h1>{session.topic}</h1>
        </div>
        <div className="flex gap-2">
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
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} strokeWidth={1.75} className="text-accent-text" />
            <h3 className="m-0">Hasil Riset</h3>
          </div>

          <div className="stats-grid mb-5">
            <StatCard label="YouTube Trends" value={research.youtubeTrends.length} Icon={Play} />
            <StatCard label="Social Trends"  value={research.socialTrends.length}  Icon={Hash} />
            <StatCard label="Marketplace"    value={research.marketplaceProducts.length} Icon={ShoppingBag} />
          </div>

          {research.youtubeTrends.length > 0 && (
            <>
              <div className="caption mb-2.5">Top YouTube Trends</div>
              <div className="flex flex-col gap-2">
                {research.youtubeTrends.slice(0, 4).map((v) => (
                  <div
                    key={v.videoId}
                    className="flex items-center gap-3 py-2.5 px-3.5 bg-surface-2 rounded-[var(--radius-sm)] border border-border"
                  >
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-surface-3 border border-border flex items-center justify-center shrink-0">
                      <Play size={13} strokeWidth={2} className="text-accent-text fill-accent-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm overflow-hidden text-ellipsis whitespace-nowrap text-primary">
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
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={18} strokeWidth={1.75} className="text-accent-text" />
            <h3 className="m-0">Strategi Konten</h3>
          </div>

          <div className="flex flex-col gap-4">
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
      <div className="agent-icon !w-8 !h-8 mb-2.5 !rounded-[6px]">
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div className="text-2xl font-extrabold text-accent-text leading-none mb-1">
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
        <div className="flex items-center gap-2">
          <span className="caption">Skrip {String(index + 1).padStart(2, "0")}</span>
          <span
            className="py-0.5 px-[9px] rounded-full text-[0.6875rem] font-bold font-sans"
            style={{ color: accentColor, background: `${accentColor}18` }}
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
          <div className="caption text-accent-text mb-[5px]">
            Viral Hook
          </div>
          <div className="font-bold text-base text-primary leading-[1.4]">
            &ldquo;{script.viralHook}&rdquo;
          </div>
        </div>

        {/* Script */}
        <div>
          <div className="label">Skrip</div>
          <p className="text-sm leading-[1.75]">{script.script}</p>
        </div>

        {/* CTA */}
        <div>
          <div className="label">Call to Action</div>
          <p className="text-sm">{script.callToAction}</p>
        </div>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5">
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
