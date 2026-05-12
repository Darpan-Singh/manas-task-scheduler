"use client";

import Link from "next/link";
import { Home, BarChart2, Flame } from "lucide-react";
import { usePathname } from "next/navigation";

export type NavSection = "home" | "stats" | "habits";

const TABS: { section: NavSection; href: string; icon: React.ElementType; label: string }[] = [
  { section: "home",   href: "/",          icon: Home,     label: "Home"   },
  { section: "stats",  href: "/dashboard", icon: BarChart2, label: "Stats"  },
  { section: "habits", href: "/habits",    icon: Flame,    label: "Habits" },
];

interface BottomNavProps {
  active: NavSection;
  dark?: boolean;   // true for dark pages (home, stats), false for light pages (habits)
}

export default function BottomNav({ active, dark = true }: BottomNavProps) {
  const bg      = dark ? "#09090F" : "#ffffff";
  const border  = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const dimText = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.3)";

  const ACCENT: Record<NavSection, string> = {
    home:   "#ffffff",
    stats:  "#2AACBF",
    habits: "#a855f7",
  };
  const accent = ACCENT[active];

  return (
    /* fixed bottom bar, centred inside max-w-md */
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center"
      style={{
        background: bg,
        borderTop: `1px solid ${border}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map(({ section, href, icon: Icon, label }) => {
        const isActive = section === active;
        const color = isActive ? accent : dimText;
        return (
          <Link
            key={section}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 relative"
            style={{ color }}
          >
            {/* Active dot */}
            {isActive && (
              <span
                className="absolute top-1.5 w-1 h-1 rounded-full"
                style={{ backgroundColor: accent }}
              />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span
              className="text-[10px] leading-none"
              style={{ fontWeight: isActive ? 700 : 500 }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
