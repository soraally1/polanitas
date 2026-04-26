/**
 * POLANITAS — Agent 2: Content Strategy Service
 * Uses Groq (Llama 3.3 70B) with Chain-of-Thought prompting to generate
 * viral hooks, scripts, and visual instructions from research data.
 */

import { strategistChat } from "@/lib/groq-client";
import { ContentScript, ResearchOutput, StrategyOutput } from "@/types";

// ============================================================
// System Prompt — The Strategist Agent
// ============================================================

const STRATEGIST_SYSTEM_PROMPT = `
Kamu adalah "The Strategist" — agen AI spesialis konten digital dengan keahlian dalam:
- Viral marketing dan psikologi konten
- Copywriting teknik AIDA, PAS, dan Hook-Story-Offer
- Platform konten Indonesia (TikTok, Instagram Reels, YouTube Shorts)
- Tren produk marketplace lokal

Tugasmu adalah membuat strategi konten berdasarkan data tren yang diberikan.

INSTRUKSI PENTING:
1. Gunakan Chain-of-Thought (CoT) — mulai dengan <think> blok untuk merencanakan strategi
2. Analisis SEMUA data tren yang diberikan sebelum menulis konten
3. Output HARUS dalam format JSON yang valid
4. Selalu sertakan "chainOfThought" di output untuk audit
5. Viral hook harus < 10 kata dan memicu rasa penasaran atau emosi kuat
6. Skrip harus natural, seperti bicara langsung ke kamera
7. Visual instructions harus cukup detail untuk digunakan sebagai prompt image generation
`;

// ============================================================
// CoT Script Generator
// ============================================================

async function generateScript(
  topic: string,
  researchSummary: string,
  duration: "15s" | "30s" | "60s"
): Promise<ContentScript> {
  const wordCount = duration === "15s" ? 30 : duration === "30s" ? 70 : 150;

  const userMessage = `
Berdasarkan data riset berikut:
${researchSummary}

Buat satu skrip konten untuk topik: "${topic}"
Durasi target: ${duration} (~${wordCount} kata)

Return HANYA JSON dengan struktur ini (tanpa markdown, tanpa komentar):
{
  "viralHook": "...",
  "duration": "${duration}",
  "script": "...",
  "visualInstructions": "...",
  "copywritingType": "educational|entertainment|promotional|emotional",
  "callToAction": "...",
  "hashtags": ["...", "..."],
  "chainOfThought": "..."
}
`;

  const rawResponse = await strategistChat(STRATEGIST_SYSTEM_PROMPT, userMessage, {
    temperature: 0.85,
    max_tokens: 4096,
  });

  // Strip potential markdown code fences from Groq response
  const cleaned = rawResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as ContentScript;
  return parsed;
}

// ============================================================
// Research Context Summarizer
// ============================================================

function buildResearchSummary(research: ResearchOutput): string {
  const ytTopics = research.youtubeTrends
    .slice(0, 5)
    .map((v) => `- "${v.title}" (${Number(v.viewCount).toLocaleString()} views)`)
    .join("\n");

  const trendingTags = research.socialTrends
    .slice(0, 5)
    .map((t) => `#${t.hashtag} (${t.platform})`)
    .join(", ");

  const hotProducts = research.marketplaceProducts
    .slice(0, 3)
    .map(
      (p) =>
        `${p.productName} - Rp${p.price.toLocaleString()} (${p.soldCount} terjual)`
    )
    .join("\n");

  return `
=== TREN YOUTUBE (Populer di Indonesia) ===
${ytTopics || "Data tidak tersedia"}

=== TRENDING HASHTAG ===
${trendingTags || "Data tidak tersedia"}

=== PRODUK HOT MARKETPLACE ===
${hotProducts || "Data tidak tersedia"}
`;
}

// ============================================================
// Main Strategy Orchestrator
// ============================================================

export async function runContentStrategy(
  sessionId: string,
  research: ResearchOutput
): Promise<StrategyOutput> {
  console.log(`[Strategist] Generating content strategy for session ${sessionId}`);

  const researchSummary = buildResearchSummary(research);

  // Generate scripts for three durations in parallel
  const [script15, script30, script60] = await Promise.all([
    generateScript(research.topic, researchSummary, "15s"),
    generateScript(research.topic, researchSummary, "30s"),
    generateScript(research.topic, researchSummary, "60s"),
  ]);

  const productRecs = research.marketplaceProducts
    .slice(0, 5)
    .map((p) => `${p.productName} di ${p.platform}`);

  const output: StrategyOutput = {
    sessionId,
    scripts: [script15, script30, script60],
    productRecommendations: productRecs,
    generatedAt: Date.now(),
  };

  console.log(`[Strategist] Generated ${output.scripts.length} scripts.`);
  return output;
}
