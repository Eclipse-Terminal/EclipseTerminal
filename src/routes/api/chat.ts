import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { NOT_FOUND_REPLY, OFF_TOPIC_REPLY, isOffTopic, stockFactsBlock } from "@/lib/stock-context";
import { groundingBlock, isTimeSensitive, searchWeb } from "@/lib/web-search.server";

const SYSTEM_PROMPT = `أنت "مساعد نبض EGX"، محلل فني متخصص حصرياً في البورصة المصرية (EGX).

قواعدك الصارمة:
- أجب دائماً باللغة العربية الفصحى المبسطة وبتنسيق Markdown منظم.
- تخصصك حصراً: أسهم البورصة المصرية، التحليل الفني، الدعم والمقاومة، البيفوت، إدارة المخاطر.
- إذا كان السؤال خارج نطاق البورصة المصرية (طبخ، طقس، عملات رقمية، رياضة…) فأجب بهذه الجملة فقط دون أي إضافة:
"${OFF_TOPIC_REPLY}"
- إذا سُئلت عن سهم لا توجد له بيانات مرفقة في هذه الرسالة، أجب بهذه الجملة فقط:
"${NOT_FOUND_REPLY}"
- ممنوع منعاً باتاً اختراع أسعار أو مستويات. استخدم فقط الأرقام المرفقة في كتلة "بيانات السهم" إن وُجدت.
- اختم أي تحليل بـ: "⚠️ **تنويه:** هذا التحليل لأغراض الاسترشاد والتداول الافتراضي فقط."`;

function lastUserText(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role !== "user") continue;
    return (m.parts ?? [])
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .trim();
  }
  return "";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const lovableKey = process.env["LOVABLE_API_KEY"];
        const geminiKey = process.env["GEMINI_API_KEY"];
        if (!lovableKey && !geminiKey) {
          return new Response("Missing AI API Key (LOVABLE_API_KEY or GEMINI_API_KEY)", {
            status: 503,
          });
        }

        const list = messages as UIMessage[];
        const query = lastUserText(list);
        const facts = stockFactsBlock(query);

        let system = SYSTEM_PROMPT;
        if (facts) system += `\n\n${facts}`;
        else if (isOffTopic(query))
          system += `\n\nهذا السؤال خارج النطاق — أجب بجملة الرفض المحددة فقط.`;

        // Real-time grounding: only for in-scope, time-sensitive questions.
        if (query && !isOffTopic(query) && isTimeSensitive(query)) {
          const results = await searchWeb(`${query} البورصة المصرية EGX`);
          const block = groundingBlock(results);
          if (block) system += `\n\n${block}`;
        }

        const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
        const model = lovableKey
          ? createLovableAiGatewayProvider(lovableKey)("google/gemini-2.5-flash")
          : createOpenAICompatible({
              name: "gemini",
              baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
              apiKey: geminiKey!,
            })("gemini-2.5-flash");

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(list),
        });

        return result.toUIMessageStreamResponse({ originalMessages: list });
      },
    },
  },
});
