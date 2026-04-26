"use client";
import { useAuth } from "@/components/auth/AuthProvider";

export function UserChip() {
  const { user, loading } = useAuth();
  if (loading) return <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 100 }} />;
  const name = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Pengguna";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 12px 4px 4px",
        borderRadius: 100,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        fontSize: "0.8125rem",
        fontWeight: 700,
        color: "var(--color-text-secondary)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--color-surface-2)",
        }}
      >
        <img
          src={user?.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {name}
    </div>
  );
}
