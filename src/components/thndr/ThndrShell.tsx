import type { ReactNode } from "react";
import { LangProvider } from "@/lib/i18n";
import { AccountProvider } from "@/lib/plan";
import { LivePricesProvider } from "@/lib/live-prices";
import { BottomNav } from "@/components/thndr/BottomNav";

/**
 * Thndr-style application frame rendered in ECLIPSE colours.
 * Screens own their headers/backgrounds; the frame supplies providers,
 * the page canvas tone and the fixed bottom navigation.
 */
export function ThndrShell({
  tone = "muted",
  children,
}: {
  /** Page canvas behind the content. */
  tone?: "muted" | "blue" | "dark";
  children: ReactNode;
}) {
  const bg =
    tone === "blue" ? "bg-surface-blue" : tone === "dark" ? "bg-background" : "bg-surface-muted";

  return (
    <LangProvider>
      <AccountProvider>
        <LivePricesProvider>
          <div className={`min-h-screen ${bg} pb-20`} dir="rtl">
            <div className="mx-auto w-full max-w-3xl">{children}</div>
            <BottomNav />
          </div>
        </LivePricesProvider>
      </AccountProvider>
    </LangProvider>
  );
}
