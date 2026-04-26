/**
 * POLANITAS — Agent 3: Data Analytics & Synthesis Orchestrator
 *
 * Reads the outputs from Agent 1 (Researcher) and Agent 2 (Strategist),
 * then synthesizes them into:
 *  - A market opportunity score
 *  - Key strategic insights
 *  - Visual content blueprints per platform
 *  - A priority matrix
 *  - An action plan
 *  - An executive summary
 *
 * Uses GROQ_API_KEY_DATA_ANALYTICS (dedicated key for this agent).
 */

import { analystChat } from "@/lib/groq-client";
import {
  FinalAnalysisReport,
  ResearchOutput,
  StrategyOutput,
} from "@/types";

// ── System Prompt ─────────────────────────────────────────────────────────────

const ANALYST_SYSTEM_PROMPT = `
Kamu adalah "The Analyst" — agen AI spesialis data synthesis dan strategi visual konten.
Tugasmu adalah membaca data riset pasar dari Researcher Agent dan strategi konten dari Strategist Agent,
lalu menghasilkan analisis komprehensif yang siap dieksekusi.

Keahlianmu mencakup:
- Market opportunity sizing dan gap analysis
- Visual content blueprint untuk berbagai platform digital
- Priority matrix berbasis data tren dan kompetisi pasar
- Penerjemahan data kompleks menjadi action plan yang jelas

PRINSIP OUTPUT:
1. Setiap rekomendasi harus berbasis DATA yang diberikan, bukan asumsi
2. Gunakan Bahasa Indonesia yang profesional dan mudah dipahami
3. Visual blueprint harus SPESIFIK dan dapat langsung diimplementasikan
4. Action plan harus berurutan dan realistis
5. Return HANYA valid JSON tanpa markdown atau komentar
`;

// ── Context Builder ───────────────────────────────────────────────────────────

function buildAnalysisContext(
  topic: string,
  research: ResearchOutput,
  strategy: StrategyOutput
): string {
  const ytTrends = research.youtubeTrends
    .slice(0, 5)
    .map((v) => `  - "${v.title}" oleh ${v.channelTitle} (${Number(v.viewCount).toLocaleString()} views)`)
    .join("\n");

  const socialTrends = research.socialTrends
    .slice(0, 8)
    .map((t) => `  - #${t.hashtag} di ${t.platform}${t.usageCount ? ` (${t.usageCount.toLocaleString()} penggunaan)` : ""}`)
    .join("\n");

  const marketplace = research.marketplaceProducts
    .slice(0, 5)
    .map((p) => `  - ${p.productName}: Rp${p.price.toLocaleString()}${p.soldCount ? `, ${p.soldCount} terjual` : ""} di ${p.platform}`)
    .join("\n");

  const scripts = strategy.scripts
    .map((s) => `  - [${s.duration}] Hook: "${s.viralHook}" | CTA: "${s.callToAction}" | Tipe: ${s.copywritingType}`)
    .join("\n");

  const productRecs = strategy.productRecommendations.slice(0, 5).join(", ");

  return `
TOPIK RISET: "${topic}"

=== DATA DARI RESEARCHER AGENT ===

TREN YOUTUBE:
${ytTrends || "  Tidak ada data"}

TRENDING SOSIAL MEDIA:
${socialTrends || "  Tidak ada data"}

PRODUK MARKETPLACE:
${marketplace || "  Tidak ada data"}

=== DATA DARI STRATEGIST AGENT ===

SKRIP KONTEN YANG DIBUAT:
${scripts || "  Tidak ada data"}

REKOMENDASI PRODUK:
  ${productRecs || "Tidak ada data"}
`;
}

// ── Main Analysis Function ────────────────────────────────────────────────────

export async function runFinalAnalysis(
  sessionId: string,
  topic: string,
  research: ResearchOutput,
  strategy: StrategyOutput,
  platforms: string[] = ["tiktok", "youtube"]
): Promise<FinalAnalysisReport> {
  console.log(`[Analyst] Starting final synthesis for session ${sessionId}`);

  const context = buildAnalysisContext(topic, research, strategy);

  const platformList = platforms.join(", ");
  const scriptHooks = strategy.scripts.map((s) => s.viralHook);

  const userMessage = `
${context}

TARGET PLATFORM: ${platformList}

Berdasarkan semua data di atas, buat analisis komprehensif. Return HANYA JSON dengan struktur PERSIS ini (tanpa markdown):

{
  "marketOpportunity": {
    "score": <angka 0-100>,
    "label": "<Peluang Sangat Tinggi | Peluang Tinggi | Peluang Menengah | Peluang Rendah>",
    "rationale": "<penjelasan 2-3 kalimat mengapa skor ini>",
    "topKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "whitespaceGap": "<apa yang belum ada di pasar saat ini untuk topik ini>"
  },
  "keyInsights": [
    "<insight 1 dari data riset>",
    "<insight 2>",
    "<insight 3>",
    "<insight 4>",
    "<insight 5>"
  ],
  "visualBlueprints": [
    {
      "platform": "tiktok",
      "format": "Video vertikal 9:16, durasi 15-60 detik",
      "openingFrame": "<deskripsi visual 3 detik pertama>",
      "colorPalette": ["#hex1", "#hex2", "#hex3"],
      "typographyStyle": "<deskripsi gaya tipografi>",
      "keyVisualElements": ["elemen1", "elemen2", "elemen3"],
      "estimatedCTR": "<perkiraan range CTR>"
    }
  ],
  "priorityMatrix": [
    {
      "platform": "tiktok",
      "priorityLevel": "Segera",
      "expectedReach": "<perkiraan jangkauan>",
      "effort": "Menengah"
    }
  ],
  "actionPlan": [
    {
      "order": 1,
      "title": "<judul langkah>",
      "description": "<deskripsi detail langkah>",
      "platform": "<platform target>",
      "scripts": ${JSON.stringify(scriptHooks.slice(0, 2))},
      "deadline": "Hari 1-3"
    }
  ],
  "executiveSummary": "<ringkasan eksekutif 2-3 paragraf yang menggabungkan semua temuan dan memberikan arah strategis yang jelas>"
}

PENTING:
- Buat blueprint untuk SETIAP platform dalam daftar: ${platformList}
- Action plan harus 3-5 langkah konkret dan berurutan
- Semua rekomendasi harus terkait langsung dengan data yang diberikan
`;

  const rawResponse = await analystChat(ANALYST_SYSTEM_PROMPT, userMessage, {
    temperature: 0.45,
    max_tokens: 8192,
  });

  const cleaned = rawResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  const report: FinalAnalysisReport = {
    sessionId,
    topic,
    generatedAt: Date.now(),
    ...parsed,
  };

  console.log(`[Analyst] Synthesis complete. Opportunity score: ${report.marketOpportunity.score}/100`);

  return report;
}

// ── Legacy eye-tracking exports (kept for future optional enhancement) ─────────

export { extractFixations, buildHeatmapData, generateAttentionRecommendations, runAttentionAnalysis } from "./analytics-legacy";
