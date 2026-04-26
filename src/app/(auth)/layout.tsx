import type { Metadata } from "next";
import { ThemeLogo } from "@/components/layout/ThemeLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import Link from "next/link";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "POLANITAS — Auth",
    template: "%s | POLANITAS",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Minimal top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center" }}>
          <ThemeLogo height={26} />
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: "16px 32px",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
        }}
      >
        © 2026 POLANITAS. All rights reserved.
      </footer>
    </div>
  );
}
