"use client";

import { useAgentSync } from "@/hooks/use-agent-sync";
import { AgentId, AgentStatus } from "@/types";
import { Search, Brain, Eye, Clock } from "lucide-react";

interface AgentStatusPanelProps {
  sessionId: string | null;
}

const AGENT_CONFIG: { id: AgentId; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; desc: string }[] = [
  { id: "researcher", Icon: Search, label: "The Researcher", desc: "YouTube · TikTok · Instagram · Marketplace" },
  { id: "strategist", Icon: Brain, label: "The Strategist",  desc: "CoT Copywriting · Viral Hook · Skrip Video" },
  { id: "analyst",    Icon: Eye,   label: "The Analyst",     desc: "Eye Tracking · Heatmap · F-Pattern Analysis" },
];

function getStatusClass(status: AgentStatus) {
  return `status-badge status-${status}`;
}

function getStatusLabel(status: AgentStatus) {
  const map: Record<AgentStatus, string> = {
    idle: "Menunggu", running: "Berjalan", done: "Selesai", error: "Error",
  };
  return map[status];
}

export default function AgentStatusPanel({ sessionId }: AgentStatusPanelProps) {
  const { session, isLoading } = useAgentSync(sessionId);

  return (
    <div className="bento-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Status Agen</h3>
        {session && (
          <span className="chip" style={{ fontSize: "0.6875rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.topic}
          </span>
        )}
      </div>

      {isLoading && sessionId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 74, borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {AGENT_CONFIG.map(({ id, Icon, label, desc }) => {
            const agentRun = session?.agents?.[id];
            const status: AgentStatus = agentRun?.status ?? "idle";
            const elapsed =
              agentRun?.finishedAt && agentRun?.startedAt
                ? Math.round((agentRun.finishedAt - agentRun.startedAt) / 1000)
                : null;

            return (
              <div
                key={id}
                className={`agent-card ${status === "running" ? "agent-card--active" : ""}`}
                style={{ padding: 14, gap: 0, flexDirection: "row", alignItems: "center" }}
              >
                <div className="agent-icon" style={{ width: 38, height: 38, marginRight: 12, borderRadius: "var(--radius-sm)" }}>
                  <Icon size={16} strokeWidth={1.75} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 2, color: "var(--color-text-primary)" }}>
                    {label}
                  </div>
                  <div className="caption">{desc}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: 12 }}>
                  <span className={getStatusClass(status)}>{getStatusLabel(status)}</span>
                  {elapsed !== null && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                      <Clock size={10} strokeWidth={2} /> {elapsed}s
                    </span>
                  )}
                  {agentRun?.errorMessage && (
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-error)", maxWidth: 120, textAlign: "right", lineHeight: 1.4 }}>
                      {agentRun.errorMessage.substring(0, 50)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!sessionId && (
        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Mulai sesi baru untuk melihat status agen secara real-time
        </div>
      )}
    </div>
  );
}
