/**
 * Live web grounding fallback.
 *
 * Gemini's native "Grounding with Google Search" tool is NOT exposed through the
 * managed AI gateway (the gateway rejects `tools: [{ type: "google_search" }]`
 * and the OpenRouter `:online` / `plugins: [{ id: "web" }]` variants), so we
 * fetch fresh headlines ourselves and pass them to the model as context.
 *
 * Source: Google News RSS (no API key required, works from the edge runtime).
 */

export type WebResult = {
  title: string;
  source: string;
  published: string;
  link: string;
};

/** Arabic/English cues that mean "the answer depends on current information". */
const RECENCY_HINTS = [
  "اخبار",
  "أخبار",
  "الاخبار",
  "الأخبار",
  "اليوم",
  "امس",
  "أمس",
  "الان",
  "الآن",
  "حاليا",
  "حالياً",
  "مؤخرا",
  "مؤخراً",
  "اخر",
  "آخر",
  "الاخيرة",
  "الأخيرة",
  "هذا الاسبوع",
  "هذا الأسبوع",
  "هذا الشهر",
  "جلسة",
  "الجلسة",
  "نتائج",
  "افصاح",
  "إفصاح",
  "اعلان",
  "إعلان",
  "توزيعات",
  "قرار",
  "تحديث",
  "مستجدات",
  "news",
  "today",
  "latest",
  "recent",
  "update",
];

export function isTimeSensitive(query: string) {
  const q = query.toLowerCase();
  if (RECENCY_HINTS.some((h) => q.includes(h.toLowerCase()))) return true;
  // Explicit recent years (2025+) also imply current information.
  return /\b20(2[5-9]|3\d)\b/.test(q);
}

function decodeEntities(input: string) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function pick(tag: string, item: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? decodeEntities(match[1]) : "";
}

/** Fetch fresh headlines for a query. Never throws — returns [] on failure. */
export async function searchWeb(query: string, limit = 6): Promise<WebResult[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      query,
    )}&hl=ar&gl=EG&ceid=EG:ar`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NabdEGX/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    return items.slice(0, limit).map((item) => ({
      title: pick("title", item),
      source: pick("source", item),
      published: pick("pubDate", item),
      link: pick("link", item),
    }));
  } catch {
    return [];
  }
}

/** Renders search results as an Arabic context block appended to the system prompt. */
export function groundingBlock(results: WebResult[]) {
  if (results.length === 0) return null;

  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo",
  });

  const lines = results
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}${r.source ? ` — ${r.source}` : ""}${r.published ? ` (${r.published})` : ""}`,
    )
    .join("\n");

  return [
    `# أخبار حية (تاريخ اليوم: ${today})`,
    `هذه عناوين محدَّثة تم جلبها الآن من الويب. اعتمد عليها للمعلومات الزمنية الحديثة بدلاً من معرفتك المخزنة، ولا تستنتج منها أي أسعار أو مستويات فنية:`,
    lines,
  ].join("\n");
}
