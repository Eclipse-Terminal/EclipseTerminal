import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type LiveSnapshot = {
  symbol: string;
  tvSymbol: string;
  nameAr: string;
  sectorAr: string;
  price: number;
  changePct: number;
  volume: number;
  support: number;
  resistance: number;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** EGX-Quant-Analyst-v2 system instructions. */
const SYSTEM = `أنت "EGX-Quant-Analyst-v2"، محلل كمّي محترف متخصص حصرياً في البورصة المصرية (EGX).
القواعد الملزمة:
1. أجب بالعربية الفصحى المهنية في ثلاث جمل فقط — لا عناوين ولا نقاط ولا قوائم.
2. الجملة الأولى: وضع السهم السعري الحالي والتغير اليومي. الجملة الثانية: قراءة الاتجاه والسيولة مقابل مستويي الدعم والمقاومة. الجملة الثالثة: السيناريو الفني المتوقع مع تنويه أن التحليل استرشادي.
3. ممنوع منعاً باتاً اختراع أي رقم؛ استخدم فقط الأرقام الواردة في وصف حالة الشاشة، ويجب أن يطابق تحليلك الرمز المعروض على الشارت.
4. لا تذكر أي سهم أو سوق آخر.`;

/** Turns the exact numbers rendered on screen into the model query description. */
export function describeSnapshot(s: LiveSnapshot) {
  return [
    `الشارت المعروض حالياً على TradingView هو ${s.tvSymbol}.`,
    `هذه هي الأرقام الحية المعروضة على شاشة المستخدم الآن لسهم ${s.nameAr} (${s.symbol}) — قطاع ${s.sectorAr}:`,
    `- السعر الحالي: ${money(s.price)} ج.م`,
    `- التغير اليومي: ${s.changePct.toFixed(2)}%`,
    `- حجم التداول: ${Math.round(s.volume).toLocaleString("en-US")} سهم`,
    `- الدعم المعروض: ${money(s.support)} ج.م`,
    `- المقاومة المعروضة: ${money(s.resistance)} ج.م`,
    ``,
    `حلّل هذه الأرقام فقط في ثلاث جمل.`,
  ].join("\n");
}

export async function runSmartAnalysis(snapshot: LiveSnapshot) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
    try {
      const gateway = createLovableAiGatewayProvider(lovableKey);
      const { text } = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        system: SYSTEM,
        prompt: describeSnapshot(snapshot),
        temperature: 0,
      });
      return { text };
    } catch (e) {
      console.warn("[smart-analysis] Lovable gateway error, using fallback", e);
    }
  }

  const geminiKey = process.env["GEMINI_API_KEY"];
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM }] },
            contents: [{ parts: [{ text: describeSnapshot(snapshot) }] }],
            generationConfig: { temperature: 0 },
          }),
        },
      );
      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text };
      }
    } catch (e) {
      console.warn("[smart-analysis] Gemini API call error, using fallback", e);
    }
  }

  // Deterministic local quantitative analysis
  const sign = snapshot.changePct >= 0 ? "+" : "";
  const momentum =
    snapshot.changePct > 1
      ? "زخماً إيجابياً قوياً"
      : snapshot.changePct < -1
        ? "ضغطاً بيعياً ملحوظاً"
        : "استقراراً نسبياً وحركة متوازنة";
  const proximity =
    snapshot.price >= snapshot.resistance * 0.98
      ? `قرب مستوى المقاومة (${money(snapshot.resistance)} ج.م)`
      : snapshot.price <= snapshot.support * 1.02
        ? `بالقرب من منطقة الدعم الرئيسية (${money(snapshot.support)} ج.م)`
        : `في النطاق التداولي بين الدعم (${money(snapshot.support)} ج.م) والمقاومة (${money(snapshot.resistance)} ج.م)`;

  const text = `يتداول سهم ${snapshot.nameAr} (${snapshot.symbol}) حالياً عند سعر ${money(snapshot.price)} ج.م مسجلاً ${sign}${snapshot.changePct.toFixed(2)}% مع تداولات بلغت ${Math.round(snapshot.volume).toLocaleString("en-US")} سهم. يُظهر السهم ${momentum} في قطاع ${snapshot.sectorAr} مع تحركات تتمركز ${proximity}. السيناريو الفني يرجح استمرار المسار الحالي طالما ظل السعر أعلى مستوى الدعم، ويبقى هذا التحليل لأغراض الاسترشاد والتداول الافتراضي فقط.`;

  return { text };
}
