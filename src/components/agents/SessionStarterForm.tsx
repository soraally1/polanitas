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
      <div className="mb-[18px]">
        <h3>Mulai Sesi Riset Baru</h3>
        <p className="text-sm mt-1.5">
          Masukkan topik konten dan ketiga agen AI akan bekerja secara otomatis.
        </p>
      </div>

      <form action={handleSubmit} className="flex flex-col gap-3.5">
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
          className="btn btn-primary mt-0.5"
          disabled={isPending}
        >
          <Zap size={15} strokeWidth={2.5} />
          {isPending ? "Mengaktifkan Agen..." : "Jalankan MAS"}
        </button>
      </form>

      {/* Agent flow indicator */}
      <div className="mt-[18px] py-2.5 px-3.5 bg-surface-2 rounded-[var(--radius-sm)] border border-border">
        <div className="caption mb-2">Alur Eksekusi Agen</div>
        <div className="flex items-center gap-2 text-[0.8125rem]">
          <span className="chip flex items-center gap-[5px]">
            <Search size={11} strokeWidth={2} /> Researcher
          </span>
          <ChevronRight size={12} className="text-accent-text" />
          <span className="chip flex items-center gap-[5px]">
            <Brain size={11} strokeWidth={2} /> Strategist
          </span>
          <ChevronRight size={12} className="text-accent-text" />
          <span className="chip flex items-center gap-[5px]">
            <Eye size={11} strokeWidth={2} /> Analyst
          </span>
        </div>
      </div>
    </div>
  );
}
