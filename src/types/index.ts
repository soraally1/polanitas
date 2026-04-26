/**
 * POLANITAS — Global Type Definitions
 * All shared interfaces, enums, and Zod schemas live here.
 */

import { z } from "zod/v4";

// ============================================================
// Agent Status & Orchestration
// ============================================================

export type AgentId = "researcher" | "strategist" | "analyst";

export type AgentStatus =
  | "idle"
  | "running"
  | "done"
  | "error";

export const AgentRunSchema = z.object({
  agentId: z.enum(["researcher", "strategist", "analyst"]),
  status: z.enum(["idle", "running", "done", "error"]),
  startedAt: z.number().optional(),
  finishedAt: z.number().optional(),
  errorMessage: z.string().optional(),
  sessionId: z.string(),
});

export type AgentRun = z.infer<typeof AgentRunSchema>;

// ============================================================
// Session — top-level document grouping all agent runs
// ============================================================

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  topic: z.string().min(3).max(200),
  regionCode: z.string().default("ID"),
  createdAt: z.number(),
  updatedAt: z.number(),
  agents: z.object({
    researcher: AgentRunSchema,
    strategist: AgentRunSchema,
    analyst: AgentRunSchema,
  }),
});

export type Session = z.infer<typeof SessionSchema>;

// ============================================================
// Agent 1 — Researcher: Trend Data
// ============================================================

export const YouTubeTrendSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string(),
  viewCount: z.string(),
  likeCount: z.string(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string(),
  publishedAt: z.string(),
});

export type YouTubeTrend = z.infer<typeof YouTubeTrendSchema>;

export const SocialTrendSchema = z.object({
  platform: z.enum(["tiktok", "instagram"]),
  hashtag: z.string(),
  usageCount: z.number().optional(),
  relatedSounds: z.array(z.string()).optional(),
  scrapedAt: z.number(),
});

export type SocialTrend = z.infer<typeof SocialTrendSchema>;

export const MarketplaceProductSchema = z.object({
  platform: z.enum(["tokopedia", "shopee"]),
  productName: z.string(),
  price: z.number(),
  soldCount: z.number().optional(),
  shopName: z.string().optional(),
  category: z.string(),
  url: z.string().optional(),
  scrapedAt: z.number(),
});

export type MarketplaceProduct = z.infer<typeof MarketplaceProductSchema>;

export const ResearchOutputSchema = z.object({
  sessionId: z.string(),
  topic: z.string(),
  youtubeTrends: z.array(YouTubeTrendSchema),
  socialTrends: z.array(SocialTrendSchema),
  marketplaceProducts: z.array(MarketplaceProductSchema),
  generatedAt: z.number(),
});

export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

// ============================================================
// Agent 2 — Strategist: Content Strategy
// ============================================================

export const ContentScriptSchema = z.object({
  viralHook: z.string(),
  duration: z.enum(["15s", "30s", "60s"]),
  script: z.string(),
  visualInstructions: z.string(), // Prompt for image generation
  copywritingType: z.enum(["educational", "entertainment", "promotional", "emotional"]),
  callToAction: z.string(),
  hashtags: z.array(z.string()),
  chainOfThought: z.string(), // CoT reasoning trace — stored but not shown to users by default
});

export type ContentScript = z.infer<typeof ContentScriptSchema>;

export const StrategyOutputSchema = z.object({
  sessionId: z.string(),
  scripts: z.array(ContentScriptSchema),
  productRecommendations: z.array(z.string()),
  generatedAt: z.number(),
});

export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;

// ============================================================
// Agent 3 — Analyst: Data Synthesis & Visual Blueprint
// Reads ResearchOutput + StrategyOutput, synthesizes into
// actionable conclusions, visual blueprints, and a priority plan.
// ============================================================

export const VisualBlueprintSchema = z.object({
  platform: z.string(),                 // e.g., "tiktok", "instagram-reels"
  format: z.string(),                   // e.g., "Short-form vertical video 9:16"
  openingFrame: z.string(),             // First 3 seconds description
  colorPalette: z.array(z.string()),    // Suggested colors
  typographyStyle: z.string(),          // e.g., "Bold sans-serif, high contrast"
  keyVisualElements: z.array(z.string()),
  estimatedCTR: z.string(),             // e.g., "3.5–5.2%"
});

export type VisualBlueprint = z.infer<typeof VisualBlueprintSchema>;

export const MarketOpportunitySchema = z.object({
  score: z.number().min(0).max(100),    // 0–100 opportunity score
  label: z.string(),                    // e.g., "Peluang Tinggi"
  rationale: z.string(),
  topKeywords: z.array(z.string()),
  whitespaceGap: z.string(),            // What the market lacks right now
});

export type MarketOpportunity = z.infer<typeof MarketOpportunitySchema>;

export const ActionStepSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string(),
  platform: z.string(),
  scripts: z.array(z.string()),         // Script viralHooks referenced from strategist
  deadline: z.string(),                 // e.g., "Hari 1–3"
});

export type ActionStep = z.infer<typeof ActionStepSchema>;

export const FinalAnalysisReportSchema = z.object({
  sessionId: z.string(),
  topic: z.string(),
  marketOpportunity: MarketOpportunitySchema,
  keyInsights: z.array(z.string()),     // 5–7 bullet insights from combined data
  visualBlueprints: z.array(VisualBlueprintSchema),
  priorityMatrix: z.array(z.object({
    platform: z.string(),
    priorityLevel: z.enum(["Segera", "Minggu Ini", "Bulan Ini"]),
    expectedReach: z.string(),
    effort: z.enum(["Rendah", "Menengah", "Tinggi"]),
  })),
  actionPlan: z.array(ActionStepSchema),
  executiveSummary: z.string(),         // 2–3 paragraph strategic conclusion
  generatedAt: z.number(),
});

export type FinalAnalysisReport = z.infer<typeof FinalAnalysisReportSchema>;

// ── Legacy eye-tracking types (kept for future optional enhancement) ──────────

export const GazePointSchema = z.object({
  x: z.number(),
  y: z.number(),
  timestamp: z.number(),
  elementId: z.string().optional(),
  viewport: z.object({ w: z.number(), h: z.number() }),
});

export type GazePoint = z.infer<typeof GazePointSchema>;

export const FixationSchema = z.object({
  x: z.number(),
  y: z.number(),
  duration: z.number(),
  quadrant: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]),
});

export type Fixation = z.infer<typeof FixationSchema>;

export const AttentionReportSchema = z.object({
  sessionId: z.string(),
  scriptIndex: z.number(),
  gazePoints: z.array(GazePointSchema),
  fixations: z.array(FixationSchema),
  heatmapData: z.array(z.object({ x: z.number(), y: z.number(), value: z.number() })),
  aiRecommendations: z.array(z.string()),
  recordedAt: z.number(),
});

export type AttentionReport = z.infer<typeof AttentionReportSchema>;

// ============================================================
// UI State
// ============================================================

export interface AgentCardState {
  agentId: AgentId;
  label: string;
  description: string;
  status: AgentStatus;
  progress?: number; // 0-100
}

