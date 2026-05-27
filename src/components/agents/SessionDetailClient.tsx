"use client";

import { useAgentSync } from "@/hooks/use-agent-sync";
import AgentStatusPanel from "./AgentStatusPanel";
import EyeTrackingPanel from "./EyeTrackingPanel";
import { ContentScript, YouTubeTrend, SocialTrend, MarketplaceProduct } from "@/types";
import { useState } from "react";
import {
  BarChart2,
  Play,
  ShoppingBag,
  Hash,
  Megaphone,
  Clock,
  Tag,
  TrendingUp,
  Map,
  CheckSquare,
  FileText,
  Target,
  ExternalLink,
  Music,
  ChevronRight,
  Eye,
  ThumbsUp,
  Package,
  Star,
} from "lucide-react";

interface SessionDetailClientProps {
  sessionId: string;
}

export default function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const { session, research, strategy, analytics, analysis, isLoading } = useAgentSync(sessionId);

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

          <div className="stats-grid mb-6">
            <StatCard label="YouTube Trends" value={research.youtubeTrends.length} Icon={Play} />
            <StatCard label="Social Trends"  value={research.socialTrends.length}  Icon={Hash} />
            <StatCard label="Marketplace"    value={research.marketplaceProducts.length} Icon={ShoppingBag} />
          </div>

          {/* ── YouTube Content Cards ─────────────────────────────────── */}
          {research.youtubeTrends.length > 0 && (
            <div className="mt-4">
              <div className="caption mb-3">
                Top YouTube Trends — klik untuk putar langsung
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {research.youtubeTrends.slice(0, 6).map((v) => (
                  <YouTubeCard key={v.videoId} video={v} />
                ))}
              </div>
            </div>
          )}

          {/* ── Social Trend Cards ────────────────────────────────────── */}
          {research.socialTrends.length > 0 && (
            <div className="mt-8">
              <div className="caption mb-3">Viral Hashtags &amp; Topics</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {research.socialTrends
                  .filter((t) => t.usageCount !== 0 || t.relatedSounds?.length)
                  .slice(0, 8)
                  .map((t, i) => (
                    <SocialTrendCard key={i} trend={t} />
                  ))}
                {/* AI-generated keywords (usageCount === 0, no sounds) */}
                {research.socialTrends.filter((t) => t.usageCount === 0 && !t.relatedSounds?.length).length > 0 && (
                  <div className="sm:col-span-2">
                    <div className="caption mb-2 mt-2">AI Keyword Synthesis</div>
                    <div className="flex flex-wrap gap-2">
                      {research.socialTrends
                        .filter((t) => t.usageCount === 0 && !t.relatedSounds?.length)
                        .map((t, i) => (
                          <a
                            key={i}
                            href={`https://www.tiktok.com/search?q=${encodeURIComponent(t.hashtag)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 12px",
                                borderRadius: 999,
                                background: "var(--color-accent-subtle)",
                                border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
                                fontSize: "0.8125rem",
                                fontWeight: 700,
                                color: "var(--color-accent-text)",
                              }}
                            >
                              <Hash size={11} />
                              {t.hashtag.replace(/^#/, "")}
                              <ExternalLink size={9} />
                            </span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Marketplace Product Cards ─────────────────────────────── */}
          {research.marketplaceProducts.length > 0 && (
            <div className="mt-8">
              <div className="caption mb-3">Competitor Products (Marketplace)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {research.marketplaceProducts.slice(0, 6).map((p, i) => (
                  <MarketplaceCard key={i} product={p} />
                ))}
              </div>
            </div>
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

      {/* Laporan Analisis Final */}
      {analysis && (
        <div className="bento-card animate-fade-in-up">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={18} strokeWidth={1.75} className="text-accent-text" />
            <h3 className="m-0">Laporan Analisis Final (The Analyst)</h3>
          </div>

          {/* Executive Summary */}
          <div className="bg-surface-2 border border-border rounded-[var(--radius-md)] p-[18px] mb-6">
            <div className="caption mb-2 text-accent-text">Executive Summary</div>
            <p className="text-sm leading-[1.75] text-secondary m-0">{analysis.executiveSummary}</p>
          </div>

          {/* Market Opportunity & Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Opportunity sizing */}
            <div className="bg-surface-2 border border-border rounded-[var(--radius-md)] p-[18px] flex flex-col justify-between">
              <div>
                <div className="caption mb-3 text-accent-text">Peluang Pasar (Opportunity Sizing)</div>
                <div className="flex items-center gap-4 mb-3.5">
                  <div className="relative w-16 h-16 rounded-full border-[3px] border-accent flex items-center justify-center font-extrabold text-lg text-accent-text shadow-[0_0_12px_var(--color-accent-glow)] shrink-0">
                    {analysis.marketOpportunity.score}
                  </div>
                  <div>
                    <h4 className="m-0 text-primary font-bold text-base leading-tight">{analysis.marketOpportunity.label}</h4>
                    <p className="text-[10px] text-muted-foreground m-0 mt-0.5 font-semibold">Skor Potensi Keberhasilan</p>
                  </div>
                </div>
                <p className="text-xs text-secondary leading-[1.65] m-0 mb-3">{analysis.marketOpportunity.rationale}</p>
              </div>
              <div className="text-xs text-primary leading-[1.6] pt-3 border-t border-border/60">
                <span className="font-extrabold text-accent-text">Whitespace (Celah Pasar):</span> {analysis.marketOpportunity.whitespaceGap}
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-surface-2 border border-border rounded-[var(--radius-md)] p-[18px]">
              <div className="caption mb-3.5 text-accent-text">Insight Utama (Key Insights)</div>
              <div className="flex flex-col gap-2.5">
                {analysis.keyInsights.map((insight, i) => (
                  <div key={i} className="flex gap-2 text-xs text-secondary leading-relaxed">
                    <span className="text-accent-text font-bold shrink-0">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Blueprints */}
          {analysis.visualBlueprints && analysis.visualBlueprints.length > 0 && (
            <div className="mb-6">
              <div className="caption mb-3.5 text-accent-text">Cetak Biru Gaya Visual (Visual Blueprint)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.visualBlueprints.map((bp, i) => (
                  <div key={i} className="bg-surface-2 border border-border rounded-[var(--radius-md)] p-[18px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                        <h4 className="m-0 text-primary uppercase text-xs tracking-wider font-extrabold">{bp.platform}</h4>
                        <span className="text-[10px] font-bold text-accent-text py-0.5 px-2 bg-accent-subtle border border-accent/25 rounded-full">
                          CTR: {bp.estimatedCTR}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5 mb-4">
                        <div className="text-xs leading-normal">
                          <span className="text-muted-foreground block font-semibold mb-0.5">Format Video:</span>
                          <span className="text-primary font-medium">{bp.format}</span>
                        </div>
                        <div className="text-xs leading-normal">
                          <span className="text-muted-foreground block font-semibold mb-0.5">Frame Pembuka (3 detik):</span>
                          <span className="text-primary font-medium">{bp.openingFrame}</span>
                        </div>
                        <div className="text-xs leading-normal">
                          <span className="text-muted-foreground block font-semibold mb-0.5">Tipografi & Gaya:</span>
                          <span className="text-primary font-medium">{bp.typographyStyle}</span>
                        </div>
                        <div className="text-xs leading-normal">
                          <span className="text-muted-foreground block font-semibold mb-0.5">Elemen Visual Kunci:</span>
                          <span className="text-primary font-medium">{bp.keyVisualElements.join(" · ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/40">
                      <div className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Palet Warna Konten</div>
                      <div className="flex gap-1.5">
                        {bp.colorPalette.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-full border border-border shadow-sm shrink-0"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Matrix */}
          {analysis.priorityMatrix && analysis.priorityMatrix.length > 0 && (
            <div className="mb-6">
              <div className="caption mb-3 text-accent-text">Matriks Prioritas Publikasi (Priority Matrix)</div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Skala Prioritas</th>
                      <th>Estimasi Jangkauan</th>
                      <th>Tingkat Usaha (Effort)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.priorityMatrix.map((item, i) => (
                      <tr key={i}>
                        <td className="font-bold text-primary capitalize">{item.platform}</td>
                        <td>
                          <span className={`status-badge ${
                            item.priorityLevel === "Segera" ? "status-running" : "status-idle"
                          }`}>
                            {item.priorityLevel}
                          </span>
                        </td>
                        <td className="font-bold text-accent-text">{item.expectedReach}</td>
                        <td className="caption font-semibold">{item.effort}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Plan */}
          {analysis.actionPlan && analysis.actionPlan.length > 0 && (
            <div>
              <div className="caption mb-3.5 text-accent-text">Rencana Kerja Rilis Konten (Action Plan)</div>
              <div className="flex flex-col gap-3">
                {analysis.actionPlan.map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-surface-2 border border-border rounded-[var(--radius-md)]">
                    <div className="w-8 h-8 rounded-full bg-accent-subtle border border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] flex items-center justify-center font-extrabold text-accent-text shrink-0 text-sm shadow-sm">
                      {step.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <h4 className="m-0 text-primary text-sm font-bold">{step.title}</h4>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted py-0.5 px-2 bg-surface-3 rounded-full border border-border">
                            {step.platform}
                          </span>
                          <span className="text-[10px] font-bold text-accent-text py-0.5 px-2 bg-accent-subtle border border-accent/20 rounded-full">
                            {step.deadline}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-secondary leading-relaxed m-0 mb-2.5">{step.description}</p>
                      {step.scripts && step.scripts.length > 0 && (
                        <div className="text-[10px] text-muted-foreground font-medium italic border-t border-border/40 pt-2">
                          Referensi Hook: &ldquo;{step.scripts.join(", ")}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Eye tracking */}
      {strategy && strategy.scripts.length > 0 && (
        <EyeTrackingPanel
          sessionId={sessionId}
          scripts={strategy.scripts}
          analytics={analytics}
          youtubeTrends={research?.youtubeTrends ?? []}
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

// ── YouTubeCard ───────────────────────────────────────────────────────────────
// Shows thumbnail; click expands to embedded iframe player.
function YouTubeCard({ video }: { video: YouTubeTrend }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const thumbnailUrl = video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Thumbnail / Player */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#000" }}>
        {playing ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        ) : (
          <>
            {/* Thumbnail */}
            {thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt={video.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            )}
            {/* Overlay */}
            <div
              onClick={() => setPlaying(true)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.35)")}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,0,0,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 16px rgba(255,0,0,0.4)",
                }}
              >
                <Play size={20} strokeWidth={0} fill="#fff" />
              </div>
            </div>
            {/* YouTube badge */}
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#FF0000",
                color: "#fff",
                fontSize: "0.6rem",
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 4,
                letterSpacing: "0.05em",
              }}
            >
              YouTube
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.8125rem",
            color: "var(--color-text-primary)",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {video.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            {video.channelTitle}
          </span>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.7rem", color: "var(--color-accent-text)", fontWeight: 700, textDecoration: "none" }}
          >
            Buka <ExternalLink size={10} />
          </a>
        </div>
        {Number(video.viewCount) > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
            <Eye size={10} />
            {Number(video.viewCount).toLocaleString()} views
            {Number(video.likeCount) > 0 && (
              <>
                <ThumbsUp size={10} style={{ marginLeft: 6 }} />
                {Number(video.likeCount).toLocaleString()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SocialTrendCard ───────────────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { bg: string; accent: string; label: string; searchBase: string }> = {
  tiktok: {
    bg: "linear-gradient(135deg, #010101 0%, #1a1a2e 100%)",
    accent: "#69C9D0",
    label: "TikTok",
    searchBase: "https://www.tiktok.com/search?q=",
  },
  instagram: {
    bg: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
    accent: "#fff",
    label: "Instagram",
    searchBase: "https://www.instagram.com/explore/tags/",
  },
};

function SocialTrendCard({ trend }: { trend: SocialTrend }) {
  const cfg = PLATFORM_CONFIG[trend.platform] ?? PLATFORM_CONFIG.tiktok;
  const tag = trend.hashtag.replace(/^#/, "");
  const searchUrl = trend.platform === "instagram"
    ? `${cfg.searchBase}${encodeURIComponent(tag)}`
    : `${cfg.searchBase}${encodeURIComponent(tag)}`;

  return (
    <a href={searchUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          background: cfg.bg,
          padding: "16px 16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          cursor: "pointer",
          transition: "transform 0.15s, box-shadow 0.15s",
          minHeight: 110,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
        }}
      >
        {/* Platform badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, color: cfg.accent, opacity: 0.8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {cfg.label}
          </span>
          <ExternalLink size={11} color={cfg.accent} style={{ opacity: 0.6 }} />
        </div>

        {/* Hashtag */}
        <div style={{ fontWeight: 800, fontSize: "1rem", color: cfg.accent, lineHeight: 1.2 }}>
          #{tag}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
          {trend.usageCount !== undefined && trend.usageCount > 0 && (
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: cfg.accent, opacity: 0.75, display: "flex", alignItems: "center", gap: 3 }}>
              <TrendingUp size={10} />
              {trend.usageCount.toLocaleString()} views
            </span>
          )}
          {trend.relatedSounds && trend.relatedSounds.length > 0 && (
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: cfg.accent, opacity: 0.6, display: "flex", alignItems: "center", gap: 3 }}>
              <Music size={10} />
              {trend.relatedSounds[0].slice(0, 22)}{trend.relatedSounds[0].length > 22 ? "…" : ""}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ── MarketplaceCard ───────────────────────────────────────────────────────────
const MARKETPLACE_CONFIG: Record<string, { accent: string; label: string }> = {
  tokopedia: { accent: "#42B549", label: "Tokopedia" },
  shopee:    { accent: "#EE4D2D", label: "Shopee" },
};

function MarketplaceCard({ product }: { product: MarketplaceProduct }) {
  const cfg = MARKETPLACE_CONFIG[product.platform] ?? { accent: "#6366F1", label: product.platform };

  const inner = (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1.5px solid ${cfg.accent}22`,
        background: "var(--color-surface-2)",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: product.url ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!product.url) return;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${cfg.accent}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Platform badge + link icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            color: cfg.accent,
            background: `${cfg.accent}18`,
            border: `1px solid ${cfg.accent}30`,
            padding: "2px 8px",
            borderRadius: 999,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {cfg.label}
        </span>
        {product.url && <ExternalLink size={11} color={cfg.accent} style={{ opacity: 0.6 }} />}
      </div>

      {/* Product icon + name */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${cfg.accent}12`,
            border: `1px solid ${cfg.accent}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Package size={15} color={cfg.accent} />
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.8125rem",
            color: "var(--color-text-primary)",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          } as React.CSSProperties}
        >
          {product.productName}
        </div>
      </div>

      {/* Price + sold */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: cfg.accent }}>
          Rp{product.price.toLocaleString("id-ID")}
        </span>
        {product.soldCount !== undefined && product.soldCount > 0 && (
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--color-done)",
              background: "color-mix(in srgb, var(--color-done) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-done) 20%, transparent)",
              padding: "2px 8px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Star size={9} fill="currentColor" /> {product.soldCount.toLocaleString()} terjual
          </span>
        )}
      </div>

      {/* Shop name */}
      {product.shopName && (
        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontWeight: 600, borderTop: "1px solid var(--color-border)", paddingTop: 6, marginTop: 2 }}>
          🏪 {product.shopName}
        </div>
      )}
    </div>
  );

  return product.url ? (
    <a href={product.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
      {inner}
    </a>
  ) : inner;
}
