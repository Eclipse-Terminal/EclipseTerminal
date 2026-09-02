import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Crown, History, MessageSquarePlus, Send, Square, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import aiIcon from "@/assets/ai-brain-icon.png.asset.json";
import {
  createThread,
  deleteThread,
  listThreads,
  loadMessages,
  renameThread,
  saveMessage,
  titleFrom,
  type ChatThread,
} from "@/lib/chat-history";
import { useAccount } from "@/lib/plan";
import { buildLocalAnswer } from "@/lib/stock-context";

const QUICK_PROMPTS = [
  "تحليل سهم",
  "ما هي مستويات الدعم والمقاومة؟",
  "أفضل أسهم المتابعة",
  "كيف أحسب نقاط البيفوت؟",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const { isPro, quota, openUpgrade } = useAccount();
  const [view, setView] = useState<"chat" | "history">("chat");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const openThread = useCallback(async (threadId: string) => {
    setLoading(true);
    setActiveId(threadId);
    setInitialMessages(await loadMessages(threadId));
    setLoading(false);
    setView("chat");
  }, []);

  const startNew = useCallback(async () => {
    setLoading(true);
    const thread = await createThread("محادثة جديدة");
    if (thread) {
      setThreads((prev) => [thread, ...prev]);
      setActiveId(thread.id);
      setInitialMessages([]);
      setView("chat");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open || activeId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const list = await listThreads();
      if (cancelled) return;
      setThreads(list);
      if (list[0]) {
        setActiveId(list[0].id);
        setInitialMessages(await loadMessages(list[0].id));
      } else {
        const thread = await createThread("محادثة جديدة");
        if (thread && !cancelled) {
          setThreads([thread]);
          setActiveId(thread.id);
          setInitialMessages([]);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, activeId]);

  const handleTitle = useCallback((threadId: string, text: string) => {
    setThreads((prev) => {
      const current = prev.find((t) => t.id === threadId);
      if (!current || current.title !== "محادثة جديدة") return prev;
      const title = titleFrom(text);
      void renameThread(threadId, title);
      return prev.map((t) => (t.id === threadId ? { ...t, title } : t));
    });
  }, []);

  async function removeThread(threadId: string) {
    await deleteThread(threadId);
    const rest = threads.filter((t) => t.id !== threadId);
    setThreads(rest);
    if (activeId === threadId) {
      setActiveId(null);
      setInitialMessages([]);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="افتح المساعد الذكي"
          className="fixed bottom-5 right-5 z-50 size-14 overflow-hidden rounded-full border border-primary/40 shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
        >
          <img src={aiIcon.url} alt="" className="size-full rounded-full object-cover" />
          <span className="absolute right-0 top-0 size-3 animate-pulse rounded-full bg-bull ring-2 ring-background" />
        </button>
      )}

      {open && (
        <div
          dir="rtl"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl sm:inset-x-auto sm:right-5 sm:h-[560px] sm:w-[400px]"
        >
          <header className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-8 overflow-hidden rounded-full">
                <img src={aiIcon.url} alt="" className="size-full rounded-full object-cover" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-foreground">NABD AI</p>
                {isPro ? (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <Crown className="size-3" /> PRO · أسئلة غير محدودة
                  </p>
                ) : (
                  <button
                    onClick={() => openUpgrade("limit")}
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                  >
                    {quota.used}/{quota.limit ?? 3} أسئلة مستخدمة اليوم · ترقية
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => void startNew()}
                aria-label="محادثة جديدة"
                title="محادثة جديدة"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageSquarePlus className="size-4" />
              </button>
              <button
                onClick={() => setView((v) => (v === "history" ? "chat" : "history"))}
                aria-label="السجل"
                title="السجل"
                className={`rounded-md p-1.5 transition-colors hover:text-primary ${
                  view === "history" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <History className="size-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {view === "history" ? (
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {threads.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">لا توجد محادثات محفوظة بعد.</p>
              )}
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    thread.id === activeId
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background"
                  }`}
                >
                  <button
                    onClick={() => void openThread(thread.id)}
                    className="min-w-0 flex-1 text-right"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">{thread.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(thread.updated_at).toLocaleString("ar-EG")}
                    </p>
                  </button>
                  <button
                    onClick={() => void removeThread(thread.id)}
                    aria-label="حذف المحادثة"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-bear"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : loading || !activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              جارٍ تحميل المحادثة…
            </div>
          ) : (
            <ChatPane
              key={activeId}
              threadId={activeId}
              initialMessages={initialMessages}
              onFirstUserMessage={handleTitle}
            />
          )}
        </div>
      )}
    </>
  );
}

function ChatPane({
  threadId,
  initialMessages,
  onFirstUserMessage,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onFirstUserMessage: (threadId: string, text: string) => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedIds = useRef(new Set(initialMessages.map((m) => m.id)));
  const lastQuery = useRef("");
  const [fallbacks, setFallbacks] = useState<{ id: string; text: string }[]>([]);
  const { isPro, quota, consumeQuery, openUpgrade } = useAccount();
  const capped = !isPro && !quota.allowed;

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status, fallbacks]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [busy]);

  // Persist the assistant reply once streaming settles.
  useEffect(() => {
    if (status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || savedIds.current.has(last.id)) return;
    savedIds.current.add(last.id);
    void saveMessage(threadId, last);
  }, [status, messages, threadId]);

  // Offline analyst engine: when the AI gateway fails, answer from local EGX data.
  useEffect(() => {
    if (!error || !lastQuery.current) return;
    const query = lastQuery.current;
    lastQuery.current = "";
    const id = `local-${Date.now()}`;
    const text = buildLocalAnswer(query);
    savedIds.current.add(id);
    setFallbacks((prev) => [...prev, { id, text }]);
    void saveMessage(threadId, { id, role: "assistant", parts: [{ type: "text", text }] });
  }, [error, threadId]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    if (capped) {
      openUpgrade("limit");
      return;
    }
    const allowed = await consumeQuery();
    if (!allowed) return;
    setInput("");
    if (messages.length === 0) onFirstUserMessage(threadId, value);
    const id = `user-${Date.now()}`;
    savedIds.current.add(id);
    lastQuery.current = value;
    void saveMessage(threadId, { id, role: "user", parts: [{ type: "text", text: value }] });
    void sendMessage({ text: value });
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              اسألني عن أي سهم في البورصة المصرية، المستويات الفنية، أو أساسيات الاستثمار.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void send(prompt)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
          if (!text) return null;
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={isUser ? "flex justify-start" : ""}>
              <div
                className={
                  isUser
                    ? "max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                    : "text-sm leading-relaxed text-foreground"
                }
              >
                {isUser ? (
                  text
                ) : (
                  <div className="space-y-2 [&_a]:text-primary [&_li]:mr-4 [&_ol]:list-decimal [&_strong]:text-foreground [&_ul]:list-disc">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {fallbacks.map((f) => (
          <div key={f.id} className="text-sm leading-relaxed text-foreground">
            <div className="space-y-2 [&_a]:text-primary [&_li]:mr-4 [&_ol]:list-decimal [&_strong]:text-foreground [&_ul]:list-disc">
              <ReactMarkdown>{f.text}</ReactMarkdown>
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <p className="animate-pulse text-sm text-muted-foreground">جارٍ التفكير…</p>
        )}
        {error && (
          <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
            تعذّر الاتصال بمحرك الذكاء الاصطناعي — تم الرد من بيانات البورصة المحلية داخل التطبيق.
          </p>
        )}
      </div>

      {messages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-border px-3 py-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void send(prompt)}
              disabled={busy}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {capped && (
        <button
          onClick={() => openUpgrade("limit")}
          className="border-t border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-bold text-primary"
        >
          استهلكت 3/3 أسئلة مجانية اليوم — ترقّ إلى PRO لأسئلة غير محدودة 🔒
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-background/60 p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={capped}
          placeholder={capped ? "الحد المجاني اليومي انتهى…" : "اكتب سؤالك هنا…"}
          className="flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            aria-label="إيقاف"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-bear"
          >
            <Square className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || capped}
            aria-label="إرسال"
            className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <Send className="size-4 rotate-180" />
          </button>
        )}
      </form>
    </>
  );
}
