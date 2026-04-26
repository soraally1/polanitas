/**
 * POLANITAS — Server Actions: Agent Orchestration
 *
 * All API keys (Groq, Firebase Admin, YouTube, Apify) stay on the server.
 * Client components call these actions via React's Server Function mechanism.
 *
 * Security note (from Next.js docs): Server Functions are reachable via direct POST
 * requests. Always verify authentication inside every Server Function.
 */

"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { runMarketResearch } from "@/services/market-research-service";
import { runContentStrategy } from "@/services/content-strategy-service";
import { runFinalAnalysis } from "@/services/analytics-orchestrator";
import { GazePoint, ResearchOutput, Session, StrategyOutput } from "@/types";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { z } from "zod/v4";

// ============================================================
// Auth Helper
// ============================================================

async function requireAuth(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("Unauthorized: No session cookie found.");
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    throw new Error("Unauthorized: Invalid or expired session.");
  }
}

// ============================================================
// Action 1: Create Session & Trigger Researcher Agent
// ============================================================

const StartResearchSchema = z.object({
  topic: z.string().min(3).max(200),
  regionCode: z.string().default("ID"),
  platforms: z.array(z.string()).default(["tiktok", "youtube"]),
  researchFocus: z.string().default("trend-konten"),
  targetAudience: z.string().max(200).optional(),
});

export async function startResearchSession(formData: FormData) {
  const uid = await requireAuth();

  const platformsRaw = formData.get("platforms");
  const parsed = StartResearchSchema.safeParse({
    topic: formData.get("topic"),
    regionCode: formData.get("regionCode") ?? "ID",
    platforms: platformsRaw ? JSON.parse(String(platformsRaw)) : ["tiktok", "youtube"],
    researchFocus: formData.get("researchFocus") ?? "trend-konten",
    targetAudience: formData.get("targetAudience") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { topic, regionCode, platforms, researchFocus, targetAudience } = parsed.data;

  // 1. Create session in Firestore
  const sessionRef = adminDb.collection("sessions").doc();
  const sessionId = sessionRef.id;
  const now = Date.now();

  const initialSession: Session = {
    id: sessionId,
    userId: uid,
    topic,
    regionCode,
    createdAt: now,
    updatedAt: now,
    agents: {
      researcher: { agentId: "researcher", status: "running", startedAt: now, sessionId },
      strategist: { agentId: "strategist", status: "idle", sessionId },
      analyst: { agentId: "analyst", status: "idle", sessionId },
    },
  };

  // Store extra context as metadata alongside the session
  await sessionRef.set({
    ...initialSession,
    platforms,
    researchFocus,
    ...(targetAudience ? { targetAudience } : {}),
  });

  // 2. Run Researcher Agent
  try {
    const enrichedTopic = targetAudience
      ? `${topic} — Target audiens: ${targetAudience} — Fokus: ${researchFocus}`
      : `${topic} — Fokus: ${researchFocus}`;
    const research = await runMarketResearch(sessionId, enrichedTopic, regionCode);

    // 3. Store research output and hand off to Strategist
    await sessionRef.update({
      "agents.researcher.status": "done",
      "agents.researcher.finishedAt": Date.now(),
      "agents.strategist.status": "running",
      "agents.strategist.startedAt": Date.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("sessions").doc(sessionId).collection("research").doc("output").set(research);

    // 4. Hand off to Strategist (which then chains to Analyst with research context)
    await runStrategyAgent(sessionId, research, enrichedTopic, platforms);

    return { sessionId };
  } catch (err: any) {
    await sessionRef.update({
      "agents.researcher.status": "error",
      "agents.researcher.errorMessage": err.message ?? "Unknown error",
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { error: { _: err.message } };
  }
}

// ── Internal: Strategist → Analyst chain ────────────────────────────────────

async function runStrategyAgent(
  sessionId: string,
  research: ResearchOutput,
  topic: string,
  platforms: string[]
): Promise<void> {
  const sessionRef = adminDb.collection("sessions").doc(sessionId);

  try {
    const strategy = await runContentStrategy(sessionId, research);

    await sessionRef.update({
      "agents.strategist.status": "done",
      "agents.strategist.finishedAt": Date.now(),
      "agents.analyst.status": "running",
      "agents.analyst.startedAt": Date.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("sessions").doc(sessionId).collection("strategy").doc("output").set(strategy);

    // ── Chain to Analyst Agent automatically ─────────────────────────────────
    await runAnalystAgent(sessionId, topic, research, strategy, platforms);

  } catch (err: any) {
    await sessionRef.update({
      "agents.strategist.status": "error",
      "agents.strategist.errorMessage": err.message ?? "Unknown error",
      updatedAt: FieldValue.serverTimestamp(),
    });
    throw err;
  }
}

async function runAnalystAgent(
  sessionId: string,
  topic: string,
  research: ResearchOutput,
  strategy: StrategyOutput,
  platforms: string[]
): Promise<void> {
  const sessionRef = adminDb.collection("sessions").doc(sessionId);

  try {
    const report = await runFinalAnalysis(sessionId, topic, research, strategy, platforms);

    await adminDb.collection("sessions").doc(sessionId).collection("analysis").doc("output").set(report);

    await sessionRef.update({
      "agents.analyst.status": "done",
      "agents.analyst.finishedAt": Date.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err: any) {
    await sessionRef.update({
      "agents.analyst.status": "error",
      "agents.analyst.errorMessage": err.message ?? "Unknown error",
      updatedAt: FieldValue.serverTimestamp(),
    });
    throw err;
  }
}

// ============================================================
// Action 3: Submit Eye Tracking Data → Trigger Analyst Agent
// ============================================================

const SubmitGazeSchema = z.object({
  sessionId: z.string().min(1),
  scriptIndex: z.number().int().min(0),
  scriptContent: z.string().min(1),
});

export async function submitGazeData(
  rawData: { sessionId: string; scriptIndex: number; scriptContent: string },
  gazePoints: GazePoint[]
) {
  const uid = await requireAuth();

  const parsed = SubmitGazeSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { sessionId, scriptIndex, scriptContent } = parsed.data;

  // Verify session belongs to this user
  const sessionSnap = await adminDb.collection("sessions").doc(sessionId).get();
  if (!sessionSnap.exists || sessionSnap.data()?.userId !== uid) {
    return { error: { _: "Session not found or unauthorized." } };
  }

  const sessionRef = adminDb.collection("sessions").doc(sessionId);

  await sessionRef.update({
    "agents.analyst.status": "running",
    "agents.analyst.startedAt": Date.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  try {
    const report = await runAttentionAnalysis(
      sessionId,
      scriptIndex,
      gazePoints,
      scriptContent
    );

    await adminDb
      .collection("sessions")
      .doc(sessionId)
      .collection("analytics")
      .add(report);

    await sessionRef.update({
      "agents.analyst.status": "done",
      "agents.analyst.finishedAt": Date.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { report };
  } catch (err: any) {
    await sessionRef.update({
      "agents.analyst.status": "error",
      "agents.analyst.errorMessage": err.message,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { error: { _: err.message } };
  }
}
