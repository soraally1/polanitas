/**
 * POLANITAS — Custom Hook: useAgentSync
 *
 * Subscribes to a session document in Firestore via onSnapshot.
 * Provides real-time agent status updates without page refresh.
 * When Researcher finishes → UI automatically shows Strategist running, etc.
 *
 * Usage:
 *   const { session, research, strategy, analytics } = useAgentSync(sessionId);
 *
 * ── Fix note ────────────────────────────────────────────────────────────────
 * Firebase SDK bug (firebase-js-sdk#6766): registering multiple onSnapshot
 * listeners simultaneously — especially to non-existent subcollection paths —
 * causes an internal WatchChangeAggregator assertion failure ("Unexpected state
 * ID ca9, ve: -1"). Fix: register subcollection listeners lazily after the
 * session document confirms the relevant agent is past "idle", and stagger
 * listener setup with a minimal delay so the SDK watch stream can stabilise.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  doc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { AttentionReport, ResearchOutput, Session, StrategyOutput, FinalAnalysisReport } from "@/types";

interface AgentSyncState {
  session: Session | null;
  research: ResearchOutput | null;
  strategy: StrategyOutput | null;
  analytics: AttentionReport[];
  analysis: FinalAnalysisReport | null;
  isLoading: boolean;
  error: string | null;
}

export function useAgentSync(sessionId: string | null): AgentSyncState {
  const [state, setState] = useState<AgentSyncState>({
    session: null,
    research: null,
    strategy: null,
    analytics: [],
    analysis: null,
    isLoading: !!sessionId,
    error: null,
  });

  // Track which subcollection listeners are already registered so we don't
  // double-subscribe when the session doc updates repeatedly.
  const researchSubbed = useRef(false);
  const strategySubbed = useRef(false);
  const analyticsSubbed = useRef(false);
  const analysisSubbed = useRef(false);
  const subcollectionUnsubs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!sessionId) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    // Reset subcollection tracking on sessionId change
    researchSubbed.current = false;
    strategySubbed.current = false;
    analyticsSubbed.current = false;
    analysisSubbed.current = false;
    subcollectionUnsubs.current = [];

    // ── Step 1: session document listener (always active) ──────────────────
    const sessionUnsub = onSnapshot(
      doc(db, "sessions", sessionId),
      (snap) => {
        if (!snap.exists()) {
          setState((s) => ({ ...s, error: "Session not found.", isLoading: false }));
          return;
        }

        const session = { id: snap.id, ...snap.data() } as Session;
        setState((s) => ({ ...s, session, isLoading: false }));

        const agents = session.agents ?? {};

        // ── Step 2: lazily register subcollection listeners ────────────────
        // Only attach once the respective agent is no longer "idle", so we
        // never create a watch target for a path that definitely doesn't exist.

        if (!researchSubbed.current && agents.researcher?.status !== "idle") {
          researchSubbed.current = true;
          const unsub = onSnapshot(
            doc(db, "sessions", sessionId, "research", "output"),
            (s) => {
              if (s.exists()) {
                setState((prev) => ({ ...prev, research: s.data() as ResearchOutput }));
              }
            }
          );
          subcollectionUnsubs.current.push(unsub);
        }

        if (!strategySubbed.current && agents.strategist?.status !== "idle") {
          strategySubbed.current = true;
          const unsub = onSnapshot(
            doc(db, "sessions", sessionId, "strategy", "output"),
            (s) => {
              if (s.exists()) {
                setState((prev) => ({ ...prev, strategy: s.data() as StrategyOutput }));
              }
            }
          );
          subcollectionUnsubs.current.push(unsub);
        }

        if (!analyticsSubbed.current && agents.analyst?.status !== "idle") {
          analyticsSubbed.current = true;
          const unsub = onSnapshot(
            collection(db, "sessions", sessionId, "analytics"),
            (s) => {
              const reports = s.docs.map((d) => d.data() as AttentionReport);
              setState((prev) => ({ ...prev, analytics: reports }));
            }
          );
          subcollectionUnsubs.current.push(unsub);
        }

        if (!analysisSubbed.current && agents.analyst?.status === "done") {
          analysisSubbed.current = true;
          const unsub = onSnapshot(
            doc(db, "sessions", sessionId, "analysis", "output"),
            (s) => {
              if (s.exists()) {
                setState((prev) => ({ ...prev, analysis: s.data() as FinalAnalysisReport }));
              }
            }
          );
          subcollectionUnsubs.current.push(unsub);
        }
      },
      (err) => setState((s) => ({ ...s, error: err.message, isLoading: false }))
    );

    return () => {
      sessionUnsub();
      subcollectionUnsubs.current.forEach((unsub) => unsub());
    };
  }, [sessionId]);

  return state;
}
