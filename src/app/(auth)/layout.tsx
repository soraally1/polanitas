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
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-surface">
        <Link href="/" className="flex items-center">
          <ThemeLogo height={26} />
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center py-10 px-6">
        {children}
      </div>

      {/* Footer */}
      <footer className="py-4 px-8 border-t border-border text-center text-[0.8125rem] text-muted">
        © 2026 POLANITAS. All rights reserved.
      </footer>
    </div>
  );
}
