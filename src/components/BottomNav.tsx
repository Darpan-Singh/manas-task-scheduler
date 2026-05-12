"use client";

import Link from "next/link";
import { Home, BarChart2, Flame, UserCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { avatarUrl } from "@/components/AvatarPicker";

export type NavSection = "home" | "stats" | "habits" | "profile";

const TABS: { section: NavSection; href: string; icon: React.ElementType; label: string }[] = [
  { section: "home",    href: "/",          icon: Home,         label: "Home"    },
  { section: "stats",   href: "/dashboard", icon: BarChart2,    label: "Stats"   },
  { section: "habits",  href: "/habits",    icon: Flame,        label: "Habits"  },
  { section: "profile", href: "/profile",   icon: UserCircle2,  label: "Profile" },
];

interface BottomNavProps {
  active: NavSection;
  dark?: boolean;
}

export default function BottomNav({ active, dark = true }: BottomNavProps) {
  const { data: session } = useSession();

  const bg      = dark ? "#09090F" : "#ffffff";
  const border  = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const dimText = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.3)";

  const ACCENT: Record<NavSection, string> = {
    home:    "#ffffff",
    stats:   "#2AACBF",
    habits:  "#a855f7",
    profile: "#7C3AED",
  };
  const accent = ACCENT[active];

  const avatarStyle = (session?.user as any)?.avatarStyle || "avataaars";
  const avatarSeed  = (session?.user as any)?.avatarSeed  || "felix";

  return (
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

        if (section === "profile") {
          return (
            <Link
              key={section}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative"
              style={{ color }}
            >
              {isActive && (
                <span
                  className="absolute top-1.5 w-1 h-1 rounded-full"
                  style={{ backgroundColor: accent }}
                />
              )}
              {session?.user ? (
                <div
                  className="w-5 h-5 rounded-full overflow-hidden"
                  style={{
                    border: isActive ? `2px solid ${accent}` : "2px solid transparent",
                    boxSizing: "content-box",
                  }}
                >
                  <img
                    src={session.user.image || avatarUrl(avatarStyle, avatarSeed)}
                    alt="profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              )}
              <span className="text-[10px] leading-none" style={{ fontWeight: isActive ? 700 : 500 }}>
                {label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={section}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 relative"
            style={{ color }}
          >
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
