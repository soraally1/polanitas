import type { Metadata } from "next";
import { BarChart2, TrendingUp, FileText, Eye, Download } from "lucide-react";

export const metadata: Metadata = { title: "Reports" };

const MONTHLY_DATA = [
  { month: "Jan", sessions: 4, scripts: 12, eyeSessions: 3  },
  { month: "Feb", sessions: 6, scripts: 18, eyeSessions: 5  },
  { month: "Mar", sessions: 9, scripts: 27, eyeSessions: 8  },
  { month: "Apr", sessions: 7, scripts: 21, eyeSessions: 6  },
];

const BAR_MAX = 30;

export default function ReportsPage() {
  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p style={{ marginTop: 4 }}>Ringkasan performa dan output seluruh sesi MAS</p>
        </div>
        <button id="export-report-btn" className="btn btn-secondary">
          <Download size={14} strokeWidth={2} />
          Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Sesi",   value: "26", Icon: FileText,   trend: "+4 bulan ini"  },
          { label: "Skrip Dibuat", value: "78", Icon: BarChart2,  trend: "+21 bulan ini" },
          { label: "Eye Sessions", value: "22", Icon: Eye,        trend: "+6 bulan ini"  },
          { label: "Conversion Est.", value: "3.4%", Icon: TrendingUp, trend: "+0.8% vs bulan lalu" },
        ].map(({ label, value, Icon, trend }) => (
          <div key={label} className="stat-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="agent-icon" style={{ width: 32, height: 32, borderRadius: 6 }}>
                <Icon size={14} strokeWidth={1.75} />
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-done)",
                  padding: "2px 8px",
                  background: "color-mix(in srgb, var(--color-done) 10%, transparent)",
                  borderRadius: 999,
                }}
              >
                {trend}
              </span>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1, marginBottom: 4 }}>
              {value}
            </div>
            <div className="caption">{label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bento-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <BarChart2 size={16} strokeWidth={1.75} color="var(--color-accent-text)" />
          <h3 style={{ margin: 0 }}>Output per Bulan (2026)</h3>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Sesi", color: "var(--color-accent-text)" },
            { label: "Skrip", color: "#8B5CF6" },
            { label: "Eye Sessions", color: "#3B82F6" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
        </div>

        {/* Chart bars */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${MONTHLY_DATA.length}, 1fr)`, gap: 16, alignItems: "end" }}>
          {MONTHLY_DATA.map((d) => (
            <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* Bars */}
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120 }}>
                {[
                  { value: d.sessions,   color: "var(--color-accent-text)" },
                  { value: d.scripts,    color: "#8B5CF6"  },
                  { value: d.eyeSessions,color: "#3B82F6"  },
                ].map(({ value, color }, bi) => (
                  <div
                    key={bi}
                    style={{
                      width: 18,
                      height: `${(value / BAR_MAX) * 100}%`,
                      background: color,
                      borderRadius: "4px 4px 0 0",
                      opacity: 0.85,
                      minHeight: 4,
                    }}
                    title={`${value}`}
                  />
                ))}
              </div>
              {/* X axis label */}
              <span className="caption">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions table */}
      <div className="bento-card">
        <h3 style={{ marginBottom: 16 }}>Sesi Terbaru</h3>
        <div className="table-wrapper" style={{ border: "none", boxShadow: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Topik</th>
                <th>Skrip</th>
                <th>Eye Sessions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { topic: "Skincare untuk remaja Gen Z", scripts: 3, eye: 1, status: "done"    },
                { topic: "UMKM kuliner viral TikTok",   scripts: 3, eye: 0, status: "running" },
                { topic: "Traveling Bali backpacker",   scripts: 3, eye: 0, status: "done"    },
              ].map((row) => (
                <tr key={row.topic}>
                  <td style={{ fontWeight: 600 }}>{row.topic}</td>
                  <td>{row.scripts}</td>
                  <td>{row.eye}</td>
                  <td><span className={`status-badge status-${row.status}`}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
