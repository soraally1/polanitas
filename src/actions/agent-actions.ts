/**
 * POLANITAS — Server Actions: Agent Orchestration
 *
 * Fully removed firebase-admin dependency.
 * Auth: reads UID from the __session cookie (set by createSession).
 * DB: uses Firebase Client SDK (REST via firebase/firestore).
 *
 * Security note (from Next.js docs): Server Functions are reachable via direct POST
 * requests. Always verify authentication inside every Server Function.
 */

"use server";

import { runMarketResearch } from "@/services/market-research-service";
import { runContentStrategy } from "@/services/content-strategy-service";
import { runFinalAnalysis } from "@/services/analytics-orchestrator";
import { GazePoint, ResearchOutput, Session, StrategyOutput } from "@/types";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-server";

// ============================================================
// Auth Helper — reads UID from cookie (no Admin SDK needed)
// ============================================================

async function requireAuth(): Promise<string> {
  const cookieStore = await cookies();
  const uid = cookieStore.get("__session")?.value;
  if (!uid) {
    throw new Error("Unauthorized: No session cookie found.");
  }
  return uid;
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
  const sessionsRef = collection(db, "sessions");
  const sessionRef = doc(sessionsRef);
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

  await setDoc(sessionRef, {
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
    await updateDoc(sessionRef, {
      "agents.researcher.status": "done",
      "agents.researcher.finishedAt": Date.now(),
      "agents.strategist.status": "running",
      "agents.strategist.startedAt": Date.now(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "sessions", sessionId, "research", "output"),
      research
    );

    // 4. Hand off to Strategist → Analyst chain
    await runStrategyAgent(sessionId, research, enrichedTopic, platforms);

    return { sessionId };
  } catch (err: any) {
    await updateDoc(sessionRef, {
      "agents.researcher.status": "error",
      "agents.researcher.errorMessage": err.message ?? "Unknown error",
      updatedAt: serverTimestamp(),
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
  const sessionRef = doc(db, "sessions", sessionId);

  try {
    const strategy = await runContentStrategy(sessionId, research);

    await updateDoc(sessionRef, {
      "agents.strategist.status": "done",
      "agents.strategist.finishedAt": Date.now(),
      "agents.analyst.status": "running",
      "agents.analyst.startedAt": Date.now(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "sessions", sessionId, "strategy", "output"),
      strategy
    );

    await runAnalystAgent(sessionId, topic, research, strategy, platforms);
  } catch (err: any) {
    await updateDoc(sessionRef, {
      "agents.strategist.status": "error",
      "agents.strategist.errorMessage": err.message ?? "Unknown error",
      updatedAt: serverTimestamp(),
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
  const sessionRef = doc(db, "sessions", sessionId);

  try {
    const report = await runFinalAnalysis(sessionId, topic, research, strategy, platforms);

    await setDoc(
      doc(db, "sessions", sessionId, "analysis", "output"),
      report
    );

    await updateDoc(sessionRef, {
      "agents.analyst.status": "done",
      "agents.analyst.finishedAt": Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch (err: any) {
    await updateDoc(sessionRef, {
      "agents.analyst.status": "error",
      "agents.analyst.errorMessage": err.message ?? "Unknown error",
      updatedAt: serverTimestamp(),
    });
    throw err;
  }
}

// ============================================================
// Action 2: Submit Eye Tracking Data
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
  const sessionSnap = await getDoc(doc(db, "sessions", sessionId));
  if (!sessionSnap.exists() || sessionSnap.data()?.userId !== uid) {
    return { error: { _: "Session not found or unauthorized." } };
  }

  const sessionRef = doc(db, "sessions", sessionId);

  await updateDoc(sessionRef, {
    "agents.analyst.status": "running",
    "agents.analyst.startedAt": Date.now(),
    updatedAt: serverTimestamp(),
  });

  try {
    // runAttentionAnalysis is not yet wired — placeholder
    const report = { sessionId, scriptIndex, gazePoints, scriptContent, recordedAt: Date.now() };

    await addDoc(collection(db, "sessions", sessionId, "analytics"), report);

    await updateDoc(sessionRef, {
      "agents.analyst.status": "done",
      "agents.analyst.finishedAt": Date.now(),
      updatedAt: serverTimestamp(),
    });

    return { report };
  } catch (err: any) {
    await updateDoc(sessionRef, {
      "agents.analyst.status": "error",
      "agents.analyst.errorMessage": err.message,
      updatedAt: serverTimestamp(),
    });
    return { error: { _: err.message } };
  }
}
