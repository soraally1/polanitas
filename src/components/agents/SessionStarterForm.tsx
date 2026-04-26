"use client";

import { useTransition } from "react";
import { startResearchSession } from "@/actions/agent-actions";
import { useRouter } from "next/navigation";
import { Zap, Search, Brain, Eye, ChevronRight } from "lucide-react";

export default function SessionStarterForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await startResearchSession(formData);
      if (result?.sessionId) {
        router.push(`/dashboard/sessions/${result.sessionId}`);
      }
    });
  }

  return (
    <div className="bento-card bento-card--accent">
      <div style={{ marginBottom: 18 }}>
        <h3>Mulai Sesi Riset Baru</h3>
        <p style={{ fontSize: "0.875rem", marginTop: 5 }}>
          Masukkan topik konten dan ketiga agen AI akan bekerja secara otomatis.
        </p>
      </div>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="topic" className="label">Topik Konten</label>
          <input
            id="topic"
            name="topic"
            className="input"
            placeholder="Contoh: skincare remaja, UMKM kuliner, traveling Jawa..."
            required
            minLength={3}
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="regionCode" className="label">Region YouTube</label>
          <select id="regionCode" name="regionCode" className="input" defaultValue="ID">
            <option value="ID">Indonesia (ID)</option>
            <option value="MY">Malaysia (MY)</option>
            <option value="SG">Singapore (SG)</option>
          </select>
        </div>

        <button
          id="start-research-btn"
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
          style={{ marginTop: 2 }}
        >
          <Zap size={15} strokeWidth={2.5} />
          {isPending ? "Mengaktifkan Agen..." : "Jalankan MAS"}
        </button>
      </form>

      {/* Agent flow indicator */}
      <div
        style={{
          marginTop: 18,
          padding: "10px 14px",
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="caption" style={{ marginBottom: 8 }}>Alur Eksekusi Agen</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8125rem" }}>
          <span className="chip" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Search size={11} strokeWidth={2} /> Researcher
          </span>
          <ChevronRight size={12} color="var(--color-accent-text)" />
          <span className="chip" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Brain size={11} strokeWidth={2} /> Strategist
          </span>
          <ChevronRight size={12} color="var(--color-accent-text)" />
          <span className="chip" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Eye size={11} strokeWidth={2} /> Analyst
          </span>
        </div>
      </div>
    </div>
  );
}
