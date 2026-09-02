import { STOCKS, type Stock } from "@/lib/egx-data";

export type StockContext = {
  stock: Stock;
  price: number;
  changePct: number;
  trendAr: string;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
};

export const NOT_FOUND_REPLY =
  "عفواً، لم أجد بيانات هذا السهم حالياً في القائمة المفضلة. يرجى الترفق برمز السهم الصحيح (مثل COMI أو FWRY).";

export const OFF_TOPIC_REPLY =
  "أنا مساعد متخصص حصرياً في البورصة المصرية (EGX). كيف يمكنني مساعدتك في تحليل أسهم البورصة اليوم؟";

/** Common spoken/typo Arabic renderings that don't literally match the stock name. */
const ALIASES: Record<string, string> = {
  "سي اي بي": "COMI",
  "سى اى بى": "COMI",
  "التجاري الدولي": "COMI",
  هيرميس: "HRHO",
  هرميس: "HRHO",
  فوري: "FWRY",
  فورى: "FWRY",
  "طلعت مصطفى": "TMGH",
  "طلعت مصطفي": "TMGH",
  كيما: "KIMA",
  السويدي: "SWDY",
  السويدى: "SWDY",
  "ابو قير": "ABUK",
  "أبو قير": "ABUK",
  الشرقية: "EAST",
  الشرقيه: "EAST",
  "ايسترن كومباني": "EAST",
  اوراسكوم: "OIH",
  أوراسكوم: "OIH",
  "حديد عز": "ESRS",
  "عز الدخيلة": "IRON",
};

/** Strips diacritics and unifies hamza/alef/ya/ta-marbuta so Arabic matching is forgiving. */
export function normalizeAr(input: string) {
  return input
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function trendOf(changePct: number) {
  if (changePct >= 1.5) return "صاعد بقوة";
  if (changePct > 0.15) return "صاعد";
  if (changePct < -1.5) return "هابط بضغط بيعي";
  if (changePct < -0.15) return "هابط";
  return "عرضي / تجميع";
}

const round = (n: number) => Math.round(n * 100) / 100;

export function toContext(stock: Stock): StockContext {
  const band = Math.max(stock.resistance - stock.support, stock.price * 0.02);
  return {
    stock,
    price: stock.price,
    changePct: stock.changePct,
    trendAr: trendOf(stock.changePct),
    support1: round(stock.support),
    support2: round(stock.support - band * 0.55),
    resistance1: round(stock.resistance),
    resistance2: round(stock.resistance + band * 0.55),
  };
}

/**
 * Looks up an EGX stock mentioned anywhere in a free-text query
 * (ticker, English name, Arabic name, or a common alias).
 */
export function getStockContext(query: string): StockContext | null {
  const raw = query.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const norm = normalizeAr(raw);
  const lower = raw.toLowerCase();

  // 1. Exact ticker token (COMI, COMI.CA, EGX:COMI)
  const tokens = upper.split(/[^A-Z0-9.:]+/).filter(Boolean);
  for (const token of tokens) {
    const clean = token.replace(/^EGX:/, "").replace(/\.CA$/, "");
    const hit = STOCKS.find((s) => s.symbol === clean);
    if (hit) return toContext(hit);
  }

  // 2. Alias table
  for (const [alias, symbol] of Object.entries(ALIASES)) {
    if (norm.includes(normalizeAr(alias))) {
      const hit = STOCKS.find((s) => s.symbol === symbol);
      if (hit) return toContext(hit);
    }
  }

  // 3. Arabic / English name containment — longest name wins
  const byName = [...STOCKS]
    .map((s) => {
      const ar = normalizeAr(s.nameAr);
      const en = s.nameEn.toLowerCase();
      const matched =
        (ar.length >= 3 && norm.includes(ar)) ||
        (en.length >= 4 && lower.includes(en)) ||
        ar
          .split(" ")
          .filter((w) => w.length >= 4)
          .some((w) => norm.includes(w));
      return matched ? { s, len: Math.max(ar.length, en.length) } : null;
    })
    .filter((v): v is { s: Stock; len: number } => v !== null)
    .sort((a, b) => b.len - a.len);

  return byName[0] ? toContext(byName[0].s) : null;
}

const MARKET_TERMS = [
  "سهم",
  "اسهم",
  "بورصه",
  "egx",
  "تحليل",
  "دعم",
  "مقاومه",
  "بيفوت",
  "مؤشر",
  "تداول",
  "سيوله",
  "شراء",
  "بيع",
  "هدف",
  "وقف",
  "خساره",
  "محفظه",
  "سعر",
  "اتجاه",
  "فني",
  "توصيه",
  "استثمار",
  "ارباح",
  "توزيعات",
  "قطاع",
];

const OFF_TOPIC_TERMS = [
  "طبخ",
  "وصفه",
  "اكل",
  "طقس",
  "الجو",
  "كوره",
  "مباراه",
  "فيلم",
  "اغنيه",
  "بيتكوين",
  "كريبتو",
  "عمله رقميه",
  "دوجكوين",
  "ايثريوم",
  "سفر",
  "طيران",
  "دواء",
  "مرض",
  "weather",
  "recipe",
  "bitcoin",
  "crypto",
  "ethereum",
  "football",
  "movie",
];

/** True when the query mentions market vocabulary the assistant is allowed to handle. */
export function hasMarketTerm(query: string) {
  const norm = normalizeAr(query).toLowerCase();
  return MARKET_TERMS.some((t) => norm.includes(t));
}

/** True when the question is clearly outside the Egyptian-exchange scope. */
export function isOffTopic(query: string) {
  const norm = normalizeAr(query).toLowerCase();
  if (getStockContext(query)) return false;
  if (OFF_TOPIC_TERMS.some((t) => norm.includes(normalizeAr(t).toLowerCase()))) return true;
  // Nothing market-related at all -> out of scope.
  return !hasMarketTerm(query);
}

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Deterministic Arabic analyst card built only from local data — never invented. */
export function formatStockAnalysis(ctx: StockContext) {
  const s = ctx.stock;
  const sign = ctx.changePct >= 0 ? "+" : "";
  return `📌 **تحليل سهم ${s.nameAr} (${s.symbol})**

• **السعر الحالي:** ${money(ctx.price)} ج.م (${sign}${ctx.changePct.toFixed(2)}%)
• **الاتجاه العام:** ${ctx.trendAr}

🛡️ **مستويات الدعم والمقاومة:**
• **الدعم 1:** ${money(ctx.support1)} | **الدعم 2:** ${money(ctx.support2)}
• **المقاومة 1:** ${money(ctx.resistance1)} | **المقاومة 2:** ${money(ctx.resistance2)}

💡 **الرؤية الفنية والسيولة:**
• السهم يتحرك بناءً على المؤشرات الحالية مع رصد مستويات السيولة (متوسط التداول ${s.volume.toLocaleString("en-US")} سهم، قطاع ${s.sectorAr}).

⚠️ **تنويه:** هذا التحليل لأغراض الاسترشاد والتداول الافتراضي فقط.`;
}

/**
 * Offline answer engine: used when the AI gateway is unavailable, and as the
 * grounding block injected into the model prompt when it is available.
 */
export function buildLocalAnswer(query: string): string {
  if (isOffTopic(query)) return OFF_TOPIC_REPLY;
  const ctx = getStockContext(query);
  if (!ctx) return NOT_FOUND_REPLY;
  return formatStockAnalysis(ctx);
}

/** Compact machine-readable facts handed to the model so it cannot hallucinate prices. */
export function stockFactsBlock(query: string): string | null {
  const ctx = getStockContext(query);
  if (!ctx) return null;
  const s = ctx.stock;
  return [
    `بيانات السهم من قاعدة بيانات التطبيق (استخدمها حرفياً ولا تخترع أرقاماً غيرها):`,
    `الرمز: ${s.symbol} | الاسم: ${s.nameAr} | القطاع: ${s.sectorAr}`,
    `السعر: ${money(ctx.price)} ج.م | التغير اليومي: ${ctx.changePct.toFixed(2)}% | الاتجاه: ${ctx.trendAr}`,
    `الدعم 1: ${money(ctx.support1)} | الدعم 2: ${money(ctx.support2)}`,
    `المقاومة 1: ${money(ctx.resistance1)} | المقاومة 2: ${money(ctx.resistance2)}`,
    `حجم التداول المرجعي: ${s.volume.toLocaleString("en-US")}`,
    ``,
    `التزم بهذا القالب في الرد:`,
    formatStockAnalysis(ctx),
  ].join("\n");
}
