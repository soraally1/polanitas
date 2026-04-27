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
    <div className="bento-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3>Status Agen</h3>
        {session && (
          <span className="chip text-[0.6875rem] max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
            {session.topic}
          </span>
        )}
      </div>

      {isLoading && sessionId ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[74px] rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
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
                className={`agent-card p-3.5 !gap-0 !flex-row items-center ${status === "running" ? "agent-card--active" : ""}`}
              >
                <div className="agent-icon !w-[38px] !h-[38px] mr-3 !rounded-[var(--radius-sm)]">
                  <Icon size={16} strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-0.5 text-primary">
                    {label}
                  </div>
                  <div className="caption">{desc}</div>
                </div>

                <div className="flex flex-col items-end gap-1 ml-3">
                  <span className={getStatusClass(status)}>{getStatusLabel(status)}</span>
                  {elapsed !== null && (
                    <span className="flex items-center gap-[3px] text-[0.6875rem] text-muted">
                      <Clock size={10} strokeWidth={2} /> {elapsed}s
                    </span>
                  )}
                  {agentRun?.errorMessage && (
                    <span className="text-[0.6875rem] text-error max-w-[120px] text-right leading-[1.4]">
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
        <div className="text-center py-7 text-muted text-sm">
          Mulai sesi baru untuk melihat status agen secara real-time
        </div>
      )}
    </div>
  );
}
