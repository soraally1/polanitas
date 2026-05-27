"use client";

/**
 * Shows a green "Selesai" badge + checkmark on a module card
 * if the user has completed all lessons in that module.
 * Rendered client-side since it reads from Firestore.
 */

import { useAuth } from "@/components/auth/AuthProvider";
import { useModuleProgress } from "@/hooks/use-module-progress";
import { CheckCircle } from "lucide-react";

interface ModuleProgressBadgeProps {
  moduleId: string;
  totalLessons: number;
}

export function ModuleProgressBadge({ moduleId, totalLessons }: ModuleProgressBadgeProps) {
  const { user } = useAuth();
  const { isModuleComplete, completedLessons, isLoading } = useModuleProgress(
    moduleId,
    user?.uid,
    totalLessons,
  );

  if (isLoading || !user) return null;
  if (completedLessons.size === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: isModuleComplete ? "4px 10px" : "4px 8px",
        borderRadius: 999,
        background: isModuleComplete
          ? "rgba(34,197,94,0.18)"
          : "rgba(234,179,8,0.18)",
        border: `1px solid ${isModuleComplete ? "rgba(34,197,94,0.4)" : "rgba(234,179,8,0.4)"}`,
        backdropFilter: "blur(4px)",
        fontSize: "0.6875rem",
        fontWeight: 800,
        color: isModuleComplete ? "#16A34A" : "#A16207",
        letterSpacing: "0.03em",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <CheckCircle
        size={11}
        strokeWidth={2.5}
        color={isModuleComplete ? "#16A34A" : "#A16207"}
      />
      {isModuleComplete
        ? "Selesai"
        : `${completedLessons.size}/${totalLessons}`}
    </div>
  );
}
