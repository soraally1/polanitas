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

  // Strip enrichment suffixes added by the orchestrator (e.g. "— Target audiens: ...").
  // The YouTube search API returns 0 results for overly long queries.
  const cleanTopic = topic.split(/\s*[—\-]{1,2}\s*(Target audiens|Fokus):/)[0].trim();

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", cleanTopic);
  url.searchParams.set("type", "video");
  url.searchParams.set("regionCode", regionCode);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", apiKey);

  console.log(`[Researcher] YouTube search query: "${cleanTopic}"`);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API error: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`YouTube API error: ${data.error.message}`);
  }

  const items: YouTubeTrend[] = (data.items ?? []).map((item: any): YouTubeTrend => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    viewCount: "0",
    likeCount: "0",
    tags: [],
    thumbnail: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? "",
    publishedAt: item.snippet.publishedAt,
  }));

  console.log(`[Researcher] YouTube returned ${items.length} videos for "${cleanTopic}"`);
  return items;
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

// ============================================================
// Shopee Products via Apify
// ============================================================

export async function fetchShopeeProducts(
  keyword: string,
  limit = 10
): Promise<MarketplaceProduct[]> {
  try {
    const run = await apify.actor("jupri/shopee").call({
      keyword,
      limit,
    });

    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    return (items ?? []).map((item: any): MarketplaceProduct => {
      const name = item.name || item.title || item.product_name || "";
      const priceRaw = item.price || item.price_min || item.price_max || 0;
      const price = typeof priceRaw === "string" 
        ? Number(priceRaw.replace(/\D/g, "")) 
        : Number(priceRaw);
      
      const sold = item.historical_sold || item.sold || item.sold_count || 0;
      const shop = item.shop_name || item.shopName || item.shop_location || "";
      const url = item.url || item.link || (item.itemid ? `https://shopee.co.id/product/${item.shopid}/${item.itemid}` : "");

      return {
        platform: "shopee",
        productName: name,
        price: price,
        soldCount: Number(sold),
        shopName: shop,
        category: keyword,
        url: url,
        scrapedAt: Date.now(),
      };
    });
  } catch (error) {
    console.error("[Researcher] Shopee fetch error:", error);
    return [];
  }
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

  const [youtubeTrends, socialTikTok, socialIG, tokopediaProducts, shopeeProducts] =
    await Promise.allSettled([
      fetchYouTubeTrends(topic, regionCode),
      fetchTikTokTrends(topic),
      fetchInstagramTrends(topic),
      fetchTokopediaProducts(topic),
      fetchShopeeProducts(topic),
    ]);

  // Log any rejections so they're visible in the server log
  if (youtubeTrends.status === "rejected")    console.error("[Researcher] YouTube fetch error:",     youtubeTrends.reason);
  if (socialTikTok.status === "rejected")     console.error("[Researcher] TikTok fetch error:",      socialTikTok.reason);
  if (socialIG.status === "rejected")         console.error("[Researcher] Instagram fetch error:",   socialIG.reason);
  if (tokopediaProducts.status === "rejected") console.error("[Researcher] Tokopedia fetch error:", tokopediaProducts.reason);
  if (shopeeProducts.status === "rejected")   console.error("[Researcher] Shopee fetch error:",    shopeeProducts.reason);

  const rawOutput = {
    topic,
    youtubeTrends:
      youtubeTrends.status === "fulfilled" ? youtubeTrends.value : [],
    socialTrends: [
      ...(socialTikTok.status === "fulfilled" ? socialTikTok.value : []),
      ...(socialIG.status === "fulfilled" ? socialIG.value : []),
    ],
    marketplaceProducts: [
      ...(tokopediaProducts.status === "fulfilled" ? tokopediaProducts.value : []),
      ...(shopeeProducts.status === "fulfilled" ? shopeeProducts.value : []),
    ],
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

