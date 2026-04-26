/**
 * POLANITAS — Custom Hook: useAgentSync
 *
 * Subscribes to a session document in Firestore via onSnapshot.
 * Provides real-time agent status updates without page refresh.
 * When Researcher finishes → UI automatically shows Strategist running, etc.
 *
 * Usage:
 *   const { session, research, strategy, analytics } = useAgentSync(sessionId);
 */

"use client";

import { useEffect, useState } from "react";
import {
  doc,
  collection,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { AttentionReport, ResearchOutput, Session, StrategyOutput } from "@/types";

interface AgentSyncState {
  session: Session | null;
  research: ResearchOutput | null;
  strategy: StrategyOutput | null;
  analytics: AttentionReport[];
  isLoading: boolean;
  error: string | null;
}

export function useAgentSync(sessionId: string | null): AgentSyncState {
  const [state, setState] = useState<AgentSyncState>({
    session: null,
    research: null,
    strategy: null,
    analytics: [],
    isLoading: !!sessionId,
    error: null,
  });

  useEffect(() => {
    if (!sessionId) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    const unsubscribers: Array<() => void> = [];

    // 1. Listen to session document (agent status)
    const sessionUnsub = onSnapshot(
      doc(db, "sessions", sessionId),
      (snap) => {
        if (!snap.exists()) {
          setState((s) => ({ ...s, error: "Session not found.", isLoading: false }));
          return;
        }
        setState((s) => ({
          ...s,
          session: { id: snap.id, ...snap.data() } as Session,
          isLoading: false,
        }));
      },
      (err) => setState((s) => ({ ...s, error: err.message, isLoading: false }))
    );
    unsubscribers.push(sessionUnsub);

    // 2. Listen to research output subcollection
    const researchUnsub = onSnapshot(
      doc(db, "sessions", sessionId, "research", "output"),
      (snap) => {
        if (snap.exists()) {
          setState((s) => ({ ...s, research: snap.data() as ResearchOutput }));
        }
      }
    );
    unsubscribers.push(researchUnsub);

    // 3. Listen to strategy output subcollection
    const strategyUnsub = onSnapshot(
      doc(db, "sessions", sessionId, "strategy", "output"),
      (snap) => {
        if (snap.exists()) {
          setState((s) => ({ ...s, strategy: snap.data() as StrategyOutput }));
        }
      }
    );
    unsubscribers.push(strategyUnsub);

    // 4. Listen to analytics collection (multiple reports)
    const analyticsUnsub = onSnapshot(
      collection(db, "sessions", sessionId, "analytics"),
      (snap) => {
        const reports = snap.docs.map(
          (d) => d.data() as AttentionReport
        );
        setState((s) => ({ ...s, analytics: reports }));
      }
    );
    unsubscribers.push(analyticsUnsub);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [sessionId]);

  return state;
}
