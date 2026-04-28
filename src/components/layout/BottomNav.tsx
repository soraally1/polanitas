"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  FolderOpen,
  Search,
  Brain,
  Eye,
  Thermometer,
  BarChart2,
  BookOpen,
  ChevronUp,
} from "lucide-react";

const PRIMARY_ITEMS = [
  { href: "/dashboard",          label: "Home",      Icon: Zap        },
  { href: "/dashboard/sessions", label: "Sessions",   Icon: FolderOpen },
  { href: "/dashboard/learn",    label: "Courses",    Icon: BookOpen   },
  { href: "/dashboard/researcher", label: "Research",  Icon: Search    },
];

const SECONDARY_ITEMS = [
  { href: "/dashboard/strategist", label: "Strategy",  Icon: Brain     },
  { href: "/dashboard/analyst",    label: "Analyst",    Icon: Eye       },
  { href: "/dashboard/heatmaps",   label: "Heatmaps",   Icon: Thermometer},
  { href: "/dashboard/reports",    label: "Reports",    Icon: BarChart2  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100] flex flex-col items-center gap-3">
      {/* Secondary Items (Shelf) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-panel rounded-2xl border border-border shadow-xl p-2 flex gap-1 items-center"
          >
            {SECONDARY_ITEMS.map(({ href, label, Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <NavItem key={href} href={href} label={label} Icon={Icon} isActive={isActive} compact onClick={() => setIsOpen(false)} />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar */}
      <div className="glass-panel rounded-2xl border border-border shadow-lg p-2 flex items-center justify-between w-full max-w-md">
        {PRIMARY_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <NavItem key={href} href={href} label={label} Icon={Icon} isActive={isActive} onClick={() => setIsOpen(false)} />
          );
        })}

        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all duration-300 ${isOpen ? "bg-accent text-[#12200A]" : "text-secondary opacity-60"}`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronUp size={20} />
          </motion.div>
          <span className="text-[8px] font-bold uppercase mt-0.5">{isOpen ? "Tutup" : "Menu"}</span>
        </button>
      </div>
    </div>
  );
}

function NavItem({ href, label, Icon, isActive, compact = false, onClick }: { 
  href: string; 
  label: string; 
  Icon: any; 
  isActive: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href} className="flex-1 min-w-0" onClick={onClick}>
      <div className={`relative flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all duration-200 ${isActive ? "" : "opacity-60 hover:opacity-100"}`}>
        {isActive && (
          <motion.div 
            layoutId="nav-active-bg"
            className="absolute inset-0 bg-accent-subtle border border-accent/20 rounded-xl -z-10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        
        <Icon 
          size={compact ? 16 : 18} 
          strokeWidth={isActive ? 2.5 : 2} 
          className={isActive ? "text-accent-text" : "text-secondary"}
        />
        
        <span className={`text-[9px] font-bold uppercase tracking-tight truncate w-full text-center ${isActive ? "text-accent-text" : "text-muted"}`}>
          {label}
        </span>
      </div>
    </Link>
  );
}
