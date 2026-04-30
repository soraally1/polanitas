/**
 * POLANITAS — Agent 1: Market Research Service
 * Scrapes YouTube trends, TikTok/Instagram social trends, and Tokopedia/Shopee products.
 * All calls are server-side; API keys are never exposed to the browser.
 */

import { ApifyClient } from "apify-client";
import { researcherChat } from "@/lib/groq-client";
import {
  MarketplaceProduct,
  ResearchOutput,
  SocialTrend,
  YouTubeTrend,
} from "@/types";

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// ============================================================
// YouTube Data API v3
// ============================================================

export async function fetchYouTubeTrends(
  topic: string,
  regionCode = "ID",
  maxResults = 10
): Promise<YouTubeTrend[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set.");

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", topic);
  url.searchParams.set("type", "video");
  url.searchParams.set("regionCode", regionCode);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("order", "relevance"); // Get the most relevant videos
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // The search endpoint returns videoId inside an id object
  return (data.items ?? []).map((item: any): YouTubeTrend => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    viewCount: "0", // Search endpoint doesn't return stats by default without extra calls
    likeCount: "0",
    tags: [],
    thumbnail: item.snippet.thumbnails?.high?.url ?? "",
    publishedAt: item.snippet.publishedAt,
  }));
}

// ============================================================
// TikTok Trends via Apify
// ============================================================

export async function fetchTikTokTrends(
  keyword: string
): Promise<SocialTrend[]> {
  const run = await apify.actor("clockworks/tiktok-hashtag-scraper").call({
    hashtags: [keyword],
    resultsPerPage: 20,
  });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  return items.map((item: any): SocialTrend => ({
    platform: "tiktok",
    hashtag: item.hashtag ?? keyword,
    usageCount: item.views ?? 0,
    relatedSounds: item.music ? [item.music] : [],
    scrapedAt: Date.now(),
  }));
}

// ============================================================
// Instagram Trends via Apify
// ============================================================

export async function fetchInstagramTrends(
  hashtag: string
): Promise<SocialTrend[]> {
  const run = await apify.actor("apify/instagram-hashtag-scraper").call({
    hashtags: [hashtag],
    resultsLimit: 20,
  });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  return items.map((item: any): SocialTrend => ({
    platform: "instagram",
    hashtag: hashtag,
    usageCount: item.likesCount ?? 0,
    relatedSounds: [],
    scrapedAt: Date.now(),
  }));
}

// ============================================================
// Marketplace Intelligence via Apify
// ============================================================

export async function fetchTokopediaProducts(
  keyword: string,
  limit = 10
): Promise<MarketplaceProduct[]> {
  const run = await apify.actor("lexis-solutions/tokopedia-scraper").call({
    keyword,
    maxItems: limit,
  });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  return items.map((item: any): MarketplaceProduct => ({
    platform: "tokopedia",
    productName: item.name ?? "",
    price: Number(item.price?.replace(/\D/g, "") ?? 0),
    soldCount: item.sold ?? 0,
    shopName: item.shopName ?? "",
    category: keyword,
    url: item.url ?? "",
    scrapedAt: Date.now(),
  }));
}

// ── AI Synthesis Prompt ──────────────────────────────────────────────────────

const RESEARCHER_SYSTEM_PROMPT = `
Kamu adalah "The Researcher" — agen AI spesialis riset pasar digital Indonesia.
Tugasmu adalah menganalisis data tren mentah (YouTube, TikTok, Instagram, marketplace)
dan menghasilkan insight pasar yang tajam dan actionable.

Keahlianmu:
- Deteksi sinyal tren sebelum viral (early signal detection)
- Analisis whitespace di marketplace lokal
- Segmentasi perilaku konsumen berdasarkan data sosial
- Identifikasi peluang konten dan produk yang belum jenuh

INSTRUKSI:
1. Analisis SEMUA data yang diberikan secara mendalam
2. Identifikasi pola tren yang berulang
3. Temukan whitespace — permintaan tinggi, kompetisi konten rendah
4. Berikan 3-5 keyword viral yang paling relevan
5. Output dalam Bahasa Indonesia yang profesional
6. Return HANYA valid JSON tanpa markdown
`;

async function synthesizeResearchInsights(
  topic: string,
  raw: Omit<ResearchOutput, "sessionId" | "generatedAt">
): Promise<string[]> {
  const ytSummary = raw.youtubeTrends
    .slice(0, 5)
    .map((v) => `"${v.title}" (${Number(v.viewCount).toLocaleString()} views)`)
    .join("; ");

  const socialSummary = raw.socialTrends
    .slice(0, 6)
    .map((t) => `#${t.hashtag} di ${t.platform} (${t.usageCount?.toLocaleString() ?? "?"} penggunaan)`)
    .join(", ");

  const mktSummary = raw.marketplaceProducts
    .slice(0, 5)
    .map((p) => `${p.productName} — Rp${p.price.toLocaleString()} (${p.soldCount} terjual) di ${p.platform}`)
    .join("; ");

  const userMessage = `
Topik riset: "${topic}"

DATA YOUTUBE TRENDING:
${ytSummary || "Tidak ada data"}

DATA TREN SOSIAL MEDIA:
${socialSummary || "Tidak ada data"}

DATA PRODUK MARKETPLACE:
${mktSummary || "Tidak ada data"}

Berikan analisis mendalam dan 5 keyword viral paling relevan untuk topik ini.
Return HANYA JSON array berisi 5 string keyword tanpa markdown:
["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
`;

  try {
    const raw_response = await researcherChat(RESEARCHER_SYSTEM_PROMPT, userMessage, {
      temperature: 0.4,
      max_tokens: 1024,
    });
    const cleaned = raw_response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as string[];
  } catch {
    // Fallback: return topic keyword if AI fails
    return [topic];
  }
}

// ============================================================
// Main Research Orchestrator
// ============================================================

export async function runMarketResearch(
  sessionId: string,
  topic: string,
  regionCode = "ID"
): Promise<ResearchOutput> {
  console.log(`[Researcher] Starting research for topic: "${topic}"`);

  const [youtubeTrends, socialTikTok, socialIG, marketplaceProducts] =
    await Promise.allSettled([
      fetchYouTubeTrends(topic, regionCode),
      fetchTikTokTrends(topic),
      fetchInstagramTrends(topic),
      fetchTokopediaProducts(topic),
    ]);

  const rawOutput = {
    topic,
    youtubeTrends:
      youtubeTrends.status === "fulfilled" ? youtubeTrends.value : [],
    socialTrends: [
      ...(socialTikTok.status === "fulfilled" ? socialTikTok.value : []),
      ...(socialIG.status === "fulfilled" ? socialIG.value : []),
    ],
    marketplaceProducts:
      marketplaceProducts.status === "fulfilled"
        ? marketplaceProducts.value
        : [],
  };

  // ── AI Synthesis: Researcher Agent distills raw data into insights ──────────
  console.log(`[Researcher] Running AI synthesis with GROQ_API_KEY_MARKET_RESEARCH...`);
  const viralKeywords = await synthesizeResearchInsights(topic, rawOutput);
  console.log(`[Researcher] AI synthesis complete. Keywords: ${viralKeywords.join(", ")}`);

  const output: ResearchOutput = {
    sessionId,
    ...rawOutput,
    generatedAt: Date.now(),
    // Attach AI-synthesized keywords as the first social trend entry for downstream agents
    socialTrends: [
      ...rawOutput.socialTrends,
      ...viralKeywords.map((kw) => ({
        platform: "tiktok" as const,
        hashtag: kw,
        usageCount: 0,
        relatedSounds: [],
        scrapedAt: Date.now(),
      })),
    ],
  };

  console.log(
    `[Researcher] Finished. YouTube: ${output.youtubeTrends.length}, Social: ${output.socialTrends.length}, Marketplace: ${output.marketplaceProducts.length}`
  );

  return output;
}

