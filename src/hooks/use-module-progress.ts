/**
 * POLANITAS — useModuleProgress
 *
 * Persists quiz answers and lesson completion for a learning module to Firestore.
 * Path: /users/{uid}/moduleProgress/{moduleId}
 *
 * Usage:
 *   const { completedLessons, quizAnswers, isModuleComplete, saveAnswer } =
 *     useModuleProgress("neuromarketing", user?.uid, 4);
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export interface SavedQuizAnswer {
  selected: number;
  correct: boolean;
  answeredAt: Timestamp | null;
}

export interface ModuleProgress {
  moduleId: string;
  completedLessons: number[];
  quizAnswers: Record<number, SavedQuizAnswer>;
  completedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export function useModuleProgress(
  moduleId: string,
  uid: string | null | undefined,
  totalLessons: number,
) {
  const [progress,         setProgress]         = useState<ModuleProgress | null>(null);
  const [isLoading,        setIsLoading]         = useState(true);
  const [isSaving,         setIsSaving]          = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // ── Subscribe to Firestore ──────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }

    const ref = doc(db, "users", uid, "moduleProgress", moduleId);
    setIsLoading(true);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setProgress({
            moduleId,
            completedLessons: d.completedLessons ?? [],
            quizAnswers:      d.quizAnswers      ?? {},
            completedAt:      d.completedAt      ?? null,
            updatedAt:        d.updatedAt        ?? null,
          });
        } else {
          setProgress({
            moduleId,
            completedLessons: [],
            quizAnswers:      {},
            completedAt:      null,
            updatedAt:        null,
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("[useModuleProgress] Firestore error:", err);
        setIsLoading(false);
      },
    );

    unsubRef.current = unsub;
    return () => { unsub(); unsubRef.current = null; };
  }, [uid, moduleId]);

  // ── Save answer ─────────────────────────────────────────────────────────────
  const saveAnswer = useCallback(async (
    lessonIndex: number,
    selected: number,
    correct: boolean,
  ) => {
    if (!uid) return;
    setIsSaving(true);

    const ref = doc(db, "users", uid, "moduleProgress", moduleId);
    const existing = await getDoc(ref);
    const prev = existing.exists() ? existing.data() : {};

    const prevCompleted: number[] = prev.completedLessons ?? [];
    const newCompleted = correct && !prevCompleted.includes(lessonIndex)
      ? [...prevCompleted, lessonIndex]
      : prevCompleted;

    const allDone = newCompleted.length >= totalLessons;

    await setDoc(ref, {
      moduleId,
      completedLessons: newCompleted,
      quizAnswers: {
        ...(prev.quizAnswers ?? {}),
        [lessonIndex]: {
          selected,
          correct,
          answeredAt: serverTimestamp(),
        },
      },
      completedAt: allDone ? (prev.completedAt ?? serverTimestamp()) : null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    setIsSaving(false);
  }, [uid, moduleId, totalLessons]);

  const completedLessons = new Set<number>(progress?.completedLessons ?? []);
  const quizAnswers      = progress?.quizAnswers ?? {};
  const isModuleComplete = completedLessons.size >= totalLessons && totalLessons > 0;

  return {
    isLoading,
    isSaving,
    completedLessons,
    quizAnswers,
    isModuleComplete,
    completedAt: progress?.completedAt ?? null,
    saveAnswer,
  };
}
