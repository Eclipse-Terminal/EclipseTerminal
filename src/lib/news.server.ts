/**
 * Live EGX news feed (server-only).
 *
 * Uses the same keyless Google News RSS source as the AI grounding layer,
 * then applies a lightweight Arabic/English keyword sentiment verdict.
 */
import { searchWeb, type WebResult } from "./web-search.server";

export type LiveNewsItem = {
  id: string;
  headline: string;
  source: string;
  published: string;
  publishedLabel: string;
  link: string;
  ticker: string | null;
  verdict: "positive" | "negative" | "neutral";
};

const QUERIES = ["البورصة المصرية", "أسهم البورصة المصرية نتائج أعمال", "EGX30 Egyptian Exchange"];

const POSITIVE = [
  "ارتفاع",
  "صعود",
  "مكاسب",
  "أرباح",
  "ربح",
  "نمو",
  "توزيعات",
  "قفزة",
  "تحسن",
  "زيادة",
  "تعافي",
  "استثمار",
  "صفقة",
  "اتفاق",
  "تخارج ناجح",
  "قياسي",
  "rise",
  "gain",
  "surge",
  "profit",
  "growth",
  "dividend",
  "record",
  "upgrade",
  "beat",
];

const NEGATIVE = [
  "هبوط",
  "تراجع",
  "خسائر",
  "خسارة",
  "انخفاض",
  "أزمة",
  "تحقيق",
  "إيقاف",
  "غرامة",
  "تعثر",
  "شطب",
  "ضغوط",
  "بيع مكثف",
  "تخفيض",
  "fall",
  "drop",
  "loss",
  "decline",
  "plunge",
  "probe",
  "fine",
  "downgrade",
  "halt",
  "miss",
];

function verdictOf(text: string): LiveNewsItem["verdict"] {
  const t = text.toLowerCase();
  const pos = POSITIVE.filter((w) => t.includes(w.toLowerCase())).length;
  const neg = NEGATIVE.filter((w) => t.includes(w.toLowerCase())).length;
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

const TICKER_HINTS: Record<string, string> = {
  "التجاري الدولي": "COMI.CA",
  CIB: "COMI.CA",
  فوري: "FWRY.CA",
  "طلعت مصطفى": "TMGH.CA",
  "أبو قير": "ABUK.CA",
  "ابو قير": "ABUK.CA",
  "الحديد والصلب": "IRON.CA",
  السويدي: "SWDY.CA",
  "إي فاينانس": "EFIH.CA",
  هيرميس: "HRHO.CA",
  "المصرية للاتصالات": "ETEL.CA",
  "سيدي كرير": "SKPC.CA",
  "مصر الجديدة": "HELI.CA",
  "بالم هيلز": "PHDC.CA",
  أوراسكوم: "ORAS.CA",
  جهينة: "JUFO.CA",
};

function tickerOf(text: string) {
  for (const [needle, sym] of Object.entries(TICKER_HINTS)) {
    if (text.includes(needle)) return sym;
  }
  return null;
}

function label(published: string) {
  const d = new Date(published);
  if (Number.isNaN(d.getTime())) return published;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  if (mins < 60 * 24) return `منذ ${Math.round(mins / 60)} ساعة`;
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "long", timeZone: "Africa/Cairo" });
}

export async function fetchLiveNews(): Promise<LiveNewsItem[]> {
  const batches = await Promise.all(QUERIES.map((q) => searchWeb(q, 12)));
  const seen = new Set<string>();
  const items: LiveNewsItem[] = [];

  for (const batch of batches as WebResult[][]) {
    for (const r of batch) {
      if (!r.title) continue;
      const key = r.title.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        id: key,
        headline: r.title,
        source: r.source,
        published: r.published,
        publishedLabel: label(r.published),
        link: r.link,
        ticker: tickerOf(r.title),
        verdict: verdictOf(r.title),
      });
    }
  }

  items.sort((a, b) => {
    const ta = new Date(a.published).getTime() || 0;
    const tb = new Date(b.published).getTime() || 0;
    return tb - ta;
  });

  return items.slice(0, 24);
}
