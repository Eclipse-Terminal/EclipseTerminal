import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import {
  BarChart3,
  CalendarDays,
  Calculator,
  Crown,
  Globe,
  LineChart,
  LogOut,
  Menu,
  Bell,
  Newspaper,
  Radar,
  Shield,
  Wallet,
  X,
} from "lucide-react";
import logo from "@/assets/eclipse-logo.png";
import { TickerBar } from "@/components/TickerBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AiAssistant } from "@/components/AiAssistant";
import { MarketLive } from "@/components/modules/MarketLive";
import { PatternScanner } from "@/components/modules/PatternScanner";
import { NewsSentiment } from "@/components/modules/NewsSentiment";
import { PivotCalculator } from "@/components/modules/PivotCalculator";
import { PaperPortfolio } from "@/components/modules/PaperPortfolio";
import { EventsCalendar } from "@/components/modules/EventsCalendar";
import { PriceAlerts } from "@/components/modules/PriceAlerts";
import { LangProvider, LANGS, useLang, type DictKey } from "@/lib/i18n";
import { AccountProvider, useAccount } from "@/lib/plan";
import { LivePricesProvider } from "@/lib/live-prices";
import { PriceAlertsProvider } from "@/lib/price-alerts";
import { UpgradeModal } from "@/components/UpgradeModal";

export const Route = createFileRoute("/_authenticated/terminal")({
  head: () => ({
    meta: [
      { title: "ECLIPSE — Market Intelligence Terminal" },
      {
        name: "description",
        content:
          "AI pattern scanner, market news sentiment, pivot calculator, auto-refreshing live prices and portfolio tracking terminal.",
      },
      { property: "og:title", content: "ECLIPSE — Market Intelligence Terminal" },
      {
        property: "og:description",
        content:
          "Auto-refreshing market prices, AI technical patterns, sentiment verdicts and precision pivot targets in one terminal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LangProvider>
      <AccountProvider>
        <LivePricesProvider>
          <PriceAlertsProvider>
            <Terminal />
            <UpgradeModal />
          </PriceAlertsProvider>
        </LivePricesProvider>
      </AccountProvider>
    </LangProvider>
  ),
});

const TABS = [
  { id: "market", key: "market" as DictKey, icon: LineChart },
  { id: "scanner", key: "scanner" as DictKey, icon: Radar },
  { id: "news", key: "news" as DictKey, icon: Newspaper },
  { id: "pivot", key: "pivot" as DictKey, icon: Calculator },
  { id: "portfolio", key: "portfolio" as DictKey, icon: Wallet },
  { id: "alerts", key: "alerts" as DictKey, icon: Bell },
  { id: "events", key: "events" as DictKey, icon: CalendarDays },
];

function Terminal() {
  const { t, lang, setLang, dir } = useLang();
  const [tab, setTab] = useState("market");
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusSymbol, setFocusSymbol] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPro, isAdmin, quota, openUpgrade } = useAccount();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="space-y-1">
      {TABS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id);
              setMenuOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
              active
                ? "border border-[#2E5BFF]/40 bg-[#2E5BFF]/12 text-[#00E5FF] shadow-[0_0_24px_-14px_rgba(46,91,255,0.5)]"
                : "border border-transparent text-gray-400 hover:bg-[#121620] hover:text-white"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(item.key)}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white" dir={dir}>
      <style>{`
        @keyframes eclipse-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(46,91,255,0.35), 0 0 34px rgba(212,175,55,0.12); }
          50% { box-shadow: 0 0 30px rgba(46,91,255,0.65), 0 0 54px rgba(212,175,55,0.3); }
        }
        @keyframes eclipse-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .eclipse-logo-wrap {
          animation: eclipse-glow 3.2s ease-in-out infinite;
          transition: transform 0.4s ease;
        }
        .eclipse-logo-wrap:hover {
          transform: scale(1.08) rotate(3deg);
        }
        .eclipse-title {
          background-size: 200% auto;
          animation: eclipse-shimmer 6s ease-in-out infinite;
        }
      `}</style>
      <TickerBar />

      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 bg-[#121620]/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="shrink-0 rounded-xl border border-white/10 bg-[#121620] p-2 text-white lg:hidden hover:bg-white/5"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <div className="eclipse-logo-wrap relative group p-1.5 bg-gradient-to-tr from-[#2E5BFF]/50 via-[#8B5CF6]/30 to-[#D4AF37]/50 rounded-xl border border-[#2E5BFF]/60">
            <img
              src={logo}
              alt="ECLIPSE Terminal logo"
              width={816}
              height={816}
              className="size-9 shrink-0 rounded-lg object-contain filter contrast-125 brightness-110"
            />
            <div className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="eclipse-title truncate font-mono text-xl font-black tracking-[0.2em] sm:text-2xl"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 20%, #7DD3FC 50%, #D4AF37 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 8px rgba(46, 91, 255, 0.4))",
                }}
              >
                ECLIPSE
              </h1>
            </div>
            <p className="truncate text-[10px] text-gray-400 font-mono uppercase tracking-[0.25em] font-bold">
              MARKET INTELLIGENCE TERMINAL
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 sm:inline-flex">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("live")}
          </span>
          <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse sm:hidden" />

          {isPro ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2E5BFF]/40 bg-[#2E5BFF]/15 px-2.5 py-1.5 text-[11px] font-black text-[#00E5FF]">
              <Crown className="size-3 text-[#D4AF37]" /> PRO
            </span>
          ) : (
            <button
              onClick={() => openUpgrade("feature")}
              className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1.5 text-[11px] font-black text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/20"
            >
              <Crown className="size-3" />
              <span className="hidden sm:inline">{t("upgradeToPro")}</span>
              <span>
                {quota.used}/{quota.limit ?? 3}
              </span>
            </button>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              title={t("adminPanel")}
              aria-label={t("adminPanel")}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#121620] px-2.5 py-1.5 text-[11px] font-bold text-gray-300 transition-colors hover:text-[#00E5FF]"
            >
              <Shield className="size-3.5 text-[#00E5FF]" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <div
            className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-[#121620] p-0.5"
            role="group"
            aria-label={t("language")}
          >
            <Globe className="mx-1 size-3.5 text-[#00E5FF]" />
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                  lang === l.code
                    ? "bg-[#2E5BFF]/20 text-[#00E5FF]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={signOut}
            title={t("signOut")}
            aria-label={t("signOut")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3 py-1.5 text-xs font-bold text-gray-300 transition-colors hover:text-red-400 hover:border-red-500/30"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">{t("signOut")}</span>
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 shrink-0 border-e border-white/10 bg-[#121620]/50 p-4 lg:block backdrop-blur-md">
          <p className="mb-3 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">
            <BarChart3 className="size-3.5" /> {t("modules")}
          </p>
          {nav}
        </aside>

        {menuOpen && (
          <div className="fixed inset-x-0 top-[73px] z-20 border-b border-white/10 bg-[#0A0D14]/97 p-4 backdrop-blur-xl lg:hidden shadow-2xl">
            {nav}
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 bg-[#0A0D14]">
          {tab === "market" && <MarketLive focusSymbol={focusSymbol} />}
          {tab === "scanner" && (
            <PatternScanner
              onOpenChart={(symbol) => {
                setFocusSymbol(symbol);
                setTab("market");
              }}
            />
          )}
          {tab === "news" && <NewsSentiment />}
          {tab === "pivot" && <PivotCalculator />}
          {tab === "portfolio" && <PaperPortfolio />}
          {tab === "alerts" && <PriceAlerts />}
          {tab === "events" && <EventsCalendar />}
        </main>
      </div>

      <InstallPrompt />
      <AiAssistant />
    </div>
  );
}
