import type { Metadata } from "next";
import Link from "next/link";
import { ThemeLogo } from "@/components/layout/ThemeLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { UserChip } from "@/components/layout/UserChip";
import "../globals.css";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <ThemeLogo height={28} />
        </Link>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="chip">Beta v0.1</span>
          <ThemeToggle />
          <UserChip />
          <SignOutButton />
        </div>
      </header>

      {/* Sidebar */}
      <aside className="app-sidebar">
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="app-main">{children}</main>
    </div>
  );
}
