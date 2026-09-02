import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import logo from "@/assets/eclipse-logo.png";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — ECLIPSE | Market Intelligence Terminal" },
      {
        name: "description",
        content:
          "ادخل إلى ECLIPSE، المحرك الذكي لتحليل وتداول الأسواق: أسعار لحظية، نماذج فنية بالذكاء الاصطناعي، وتنبيهات أسعار.",
      },
      { property: "og:title", content: "ECLIPSE — Market Intelligence Terminal" },
      {
        property: "og:description",
        content: "المحرك الذكي لتحليل وتداول الأسواق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Msg = { ar: string; en: string };

function friendlyError(raw: string): Msg {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials"))
    return { ar: "البريد الإلكتروني أو كلمة السر غير صحيحة.", en: "Incorrect email or password." };
  if (m.includes("email not confirmed"))
    return {
      ar: "لم يتم تأكيد بريدك بعد — افتح رسالة التفعيل في بريدك الإلكتروني.",
      en: "Your email isn't confirmed yet — open the activation link we sent you.",
    };
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already")
  )
    return {
      ar: "هذا البريد مسجَّل بالفعل. جرّب تسجيل الدخول أو استعادة كلمة السر.",
      en: "This email is already registered. Try signing in or resetting your password.",
    };
  if (m.includes("password should be") || m.includes("weak password") || m.includes("at least"))
    return {
      ar: "كلمة السر ضعيفة — استخدم 8 أحرف على الأقل مع أرقام وحروف.",
      en: "Weak password — use at least 8 characters with letters and numbers.",
    };
  if (m.includes("rate limit") || m.includes("too many"))
    return {
      ar: "محاولات كثيرة خلال وقت قصير — انتظر دقيقة ثم أعد المحاولة.",
      en: "Too many attempts — wait a minute and try again.",
    };
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return {
      ar: "صيغة البريد الإلكتروني غير صحيحة.",
      en: "That email address doesn't look valid.",
    };
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch"))
    return {
      ar: "تعذّر الاتصال بالخادم — تحقق من الإنترنت وأعد المحاولة.",
      en: "Couldn't reach the server — check your connection and retry.",
    };
  return {
    ar: "حدث خطأ غير متوقع، حاول مرة أخرى.",
    en: raw || "Something went wrong. Please try again.",
  };
}

function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const STRENGTH: { label: Msg; bar: string; text: string }[] = [
  { label: { ar: "ضعيفة جدًا", en: "Very weak" }, bar: "bg-red-500", text: "text-red-400" },
  { label: { ar: "ضعيفة", en: "Weak" }, bar: "bg-red-500", text: "text-red-400" },
  { label: { ar: "متوسطة", en: "Fair" }, bar: "bg-[#D4AF37]", text: "text-[#D4AF37]" },
  { label: { ar: "جيدة", en: "Good" }, bar: "bg-[#00E5FF]", text: "text-[#00E5FF]" },
  { label: { ar: "قوية", en: "Strong" }, bar: "bg-emerald-400", text: "text-emerald-400" },
];

const TAPE = [
  { s: "EGX 30", v: "31,482.15", c: "+1.24%", up: true },
  { s: "EGX 70", v: "9,116.42", c: "-0.38%", up: false },
  { s: "COMI", v: "92.40", c: "+2.10%", up: true },
  { s: "FWRY", v: "7.85", c: "+3.42%", up: true },
  { s: "TMGH", v: "58.10", c: "-1.05%", up: false },
  { s: "SWDY", v: "84.62", c: "+0.74%", up: true },
];

function TerminalBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] auth-grid-drift"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,229,255,0.28) 1px, transparent 0)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 rounded-full bg-[#2563EB]/20 blur-[140px] auth-orb" />
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-white/5 bg-[#0A0D14]/70 py-2">
        <div className="flex w-max gap-8 whitespace-nowrap auth-tape">
          {[...TAPE, ...TAPE, ...TAPE].map((t, i) => (
            <span key={i} className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="font-bold text-white">{t.s}</span>
              <span>{t.v}</span>
              <span className={t.up ? "text-emerald-400" : "text-red-400"}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#070A12]/70 via-[#070A12]/85 to-[#070A12]/95" />
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: Msg } | null>(null);

  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const score = passwordScore(password);
  const strength = STRENGTH[score];

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit =
    emailValid &&
    password.length >= 6 &&
    (mode === "signin" || (score >= 2 && fullName.trim().length > 1));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setMessage(null);
    setLoading(true);
    setProgress(15);
    setStage(mode === "signin" ? "جارٍ التحقق من بياناتك…" : "جارٍ إنشاء حسابك…");

    const tick = window.setInterval(() => setProgress((p) => (p < 85 ? p + 7 : p)), 220);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        setProgress(100);
        setStage("تم إنشاء الحساب");
        setMessage({
          type: "success",
          text: {
            ar: "تم إنشاء الحساب! افتح بريدك الإلكتروني واضغط رابط التفعيل لتسجيل الدخول.",
            en: "Account created! Check your inbox and confirm your email to sign in.",
          },
        });
        setMode("signin");
        setPassword("");
      } else {
        setStage("جارٍ فتح الجلسة الآمنة…");
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setProgress(100);
        setStage("تم تسجيل الدخول — جارٍ تحميل التيرمينال…");
        navigate({ to: "/", replace: true });
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: friendlyError(raw) });
      setProgress(0);
      setStage(null);
    } finally {
      window.clearInterval(tick);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setMessage(null);
    setGoogleLoading(true);
    setStage("جارٍ التحويل إلى Google…");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return; // browser is navigating to Google
      // Tokens received and session set — head to the terminal.
      navigate({ to: "/", replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: friendlyError(raw) });
      setStage(null);
      setGoogleLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetDone(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: friendlyError(raw) });
      setShowForgot(false);
    } finally {
      setResetBusy(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#070A12] font-sans text-white"
    >
      <style>{`
        @keyframes auth-orb { 0%,100% { transform: translate(-50%,0) scale(1); opacity:.9 } 50% { transform: translate(-50%,-18px) scale(1.08); opacity:1 } }
        .auth-orb { animation: auth-orb 9s ease-in-out infinite; }
        @keyframes auth-grid { from { background-position: 0 0 } to { background-position: 44px 44px } }
        .auth-grid-drift { animation: auth-grid 12s linear infinite; }
        @keyframes auth-tape { from { transform: translateX(0) } to { transform: translateX(33.333%) } }
        .auth-tape { animation: auth-tape 32s linear infinite; }
        @keyframes auth-rise { from { opacity:0; transform: translateY(18px) scale(.98) } to { opacity:1; transform:none } }
        .auth-rise { animation: auth-rise .6s cubic-bezier(.16,1,.3,1) both; }
        @keyframes auth-logo-glow { 0%,100% { box-shadow: 0 0 20px rgba(0,229,255,.3) } 50% { box-shadow: 0 0 42px rgba(0,229,255,.65), 0 0 70px rgba(212,175,55,.25) } }
        .auth-logo { animation: auth-logo-glow 3.4s ease-in-out infinite; transition: transform .4s ease; }
        .auth-logo:hover { transform: scale(1.07) rotate(-3deg); }
        @keyframes auth-shimmer { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
        .auth-shimmer { background-size: 200% auto; animation: auth-shimmer 5s linear infinite; -webkit-background-clip: text; background-clip: text; color: transparent; }
        @media (prefers-reduced-motion: reduce) { .auth-orb,.auth-grid-drift,.auth-tape,.auth-rise,.auth-logo,.auth-shimmer { animation: none !important } }
      `}</style>
      <TerminalBackdrop />

      <main className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <section className="auth-rise w-full max-w-md rounded-3xl border border-white/10 bg-[#121826]/85 p-7 shadow-[0_30px_120px_-30px_rgba(0,229,255,0.4)] backdrop-blur-2xl">
          <header className="mb-6 text-center">
            <div className="auth-logo mb-3 inline-flex items-center justify-center rounded-2xl border border-[#00E5FF]/40 bg-[#0A0D14]/80 p-3">
              <img
                src={logo}
                alt="ECLIPSE Terminal logo"
                width={816}
                height={816}
                className="size-12 rounded-xl object-contain"
              />
            </div>
            <h1
              className="auth-shimmer font-display text-3xl font-black tracking-[0.2em]"
              style={{
                backgroundImage:
                  "linear-gradient(100deg,#FFFFFF 10%,#7DD3FC 45%,#D4AF37 80%,#FFFFFF 100%)",
              }}
            >
              ECLIPSE
            </h1>
            <p className="mt-1.5 text-[11px] font-bold tracking-widest text-[#D4AF37]">
              MARKET INTELLIGENCE TERMINAL
            </p>
          </header>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-[#00E5FF]/50 disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="size-5 animate-spin text-[#00E5FF]" />
            ) : (
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>المتابعة باستخدام Google</span>
          </button>

          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-[#121826] px-3 text-xs text-slate-500">أو</span>
          </div>

          <div className="mb-6 flex rounded-xl border border-white/10 bg-[#0A0D14] p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setMessage(null);
                  setStage(null);
                  setProgress(0);
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-[#2563EB] to-[#00E5FF] text-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "signin" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          {(stage || progress > 0) && (
            <div className="mb-4 auth-rise">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#00E5FF] via-[#2563EB] to-[#D4AF37] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {stage && <p className="mt-1.5 text-[11px] font-semibold text-[#00E5FF]">{stage}</p>}
            </div>
          )}

          {message && (
            <div
              role="status"
              className={`mb-4 flex items-start gap-2.5 rounded-xl border p-3 text-sm ${
                message.type === "error"
                  ? "border-[#EF4444]/25 bg-[#EF4444]/10 text-[#FCA5A5]"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                {message.text.ar}
                <span dir="ltr" className="mt-1 block text-xs opacity-70">
                  {message.text.en}
                </span>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="الاسم بالكامل" icon={User}>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد"
                  disabled={busy}
                  className={inputCls}
                />
              </Field>
            )}

            <Field label="البريد الإلكتروني" icon={Mail}>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={busy}
                className={inputCls}
              />
            </Field>

            <Field label="كلمة السر" icon={Lock}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={busy}
                className={`${inputCls} pl-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-3 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            {mode === "signup" && password.length > 0 && (
              <div>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < score ? strength.bar : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <p className={`mt-1.5 text-[11px] font-bold ${strength.text}`}>
                  قوة كلمة السر: {strength.label.ar}
                </p>
              </div>
            )}

            {mode === "signin" && (
              <div className="flex justify-end text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetDone(false);
                    setShowForgot(true);
                  }}
                  className="text-[#00E5FF] hover:underline"
                >
                  نسيت كلمة السر؟
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !canSubmit}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#00E5FF] via-[#2563EB] to-[#D4AF37] py-3.5 text-sm font-black text-black shadow-lg transition-all hover:opacity-90 disabled:opacity-40"
            >
              {loading && <Loader2 className="size-5 animate-spin text-black" />}
              <span>
                {loading
                  ? "جارٍ المعالجة…"
                  : mode === "signin"
                    ? "تسجيل الدخول"
                    : "إنشاء حساب جديد"}
              </span>
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="size-4 text-[#00E5FF]" />
            اتصال مشفَّر بالكامل · بياناتك محمية بأمان تام
          </p>
        </section>
      </main>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#121826] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="size-5 text-[#00E5FF]" />
              <h2 className="text-lg font-bold text-white">استعادة كلمة السر</h2>
            </div>
            {resetDone ? (
              <>
                <p className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  أرسلنا رابط إعادة التعيين إلى بريدك الإلكتروني.
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="w-full rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white"
                >
                  تمام
                </button>
              </>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputCls}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={resetBusy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                  >
                    {resetBusy && <Loader2 className="size-4 animate-spin" />}إرسال الرابط
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm text-slate-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/15 bg-[#0A0D14] py-3 pl-4 pr-10 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 disabled:opacity-60";

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-300">{label}</label>
      <div className="relative">
        <Icon className="absolute right-3.5 top-3.5 size-4 text-slate-400" />
        {children}
      </div>
    </div>
  );
}
