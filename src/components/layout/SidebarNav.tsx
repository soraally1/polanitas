"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  FolderOpen,
  Search,
  Brain,
  Eye,
  Thermometer,
  BarChart2,
  BookOpen,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard",          label: "Dashboard",  Icon: Zap        },
      { href: "/dashboard/sessions", label: "Sesi Riset", Icon: FolderOpen },
    ],
  },
  {
    label: "Pembelajaran",
    items: [
      { href: "/dashboard/learn", label: "Kurikulum", Icon: BookOpen },
    ],
  },
  {
    label: "Agen AI",
    items: [
      { href: "/dashboard/researcher", label: "Researcher", Icon: Search },
      { href: "/dashboard/strategist", label: "Strategist", Icon: Brain  },
      { href: "/dashboard/analyst",    label: "Analyst",    Icon: Eye    },
    ],
  },
  {
    label: "Analitik",
    items: [
      { href: "/dashboard/heatmaps", label: "Heatmaps", Icon: Thermometer },
      { href: "/dashboard/reports",  label: "Reports",  Icon: BarChart2   },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="nav-section">{section.label}</div>
          {section.items.map(({ href, label, Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${isActive ? "nav-item--active" : ""}`}
              >
                <Icon size={15} strokeWidth={2} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}
