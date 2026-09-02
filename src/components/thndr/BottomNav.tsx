import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Home, PieChart, User } from "lucide-react";

const ITEMS = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/portfolio", label: "المحفظة", icon: PieChart },
  { to: "/explore", label: "استكشاف", icon: Compass },
  { to: "/profile", label: "حسابي", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`press relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  active
                    ? "font-black text-neutralx"
                    : "font-semibold text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`absolute top-0 h-0.5 w-10 rounded-full bg-primary transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.6 : 1.7}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.18 : 0}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
