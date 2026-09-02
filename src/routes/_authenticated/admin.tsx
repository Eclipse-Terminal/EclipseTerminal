import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Crown,
  LineChart,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  ShieldCheck,
  ShieldMinus,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AUDIT_LABELS, logAdminAction, type AuditAction, type AuditRow } from "@/lib/audit";

const OWNER_EMAILS = [
  "sohailelnaggar551@gmail.com",
  "yasserxhacker@gmail.com",
  "montasserelnaggar69@gmail.com",
];

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner Console — Nabd EGX Terminal" },
      {
        name: "description",
        content:
          "Owner dashboard to manage Nabd EGX accounts, Pro plans, admins and EGX stock symbols.",
      },
      { property: "og:title", content: "Nabd EGX Owner Console" },
      {
        property: "og:description",
        content: "Manage users, Pro subscriptions, admins and the EGX symbol database.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) throw redirect({ to: "/auth" });

    const email = (user.email ?? "").toLowerCase();
    const metaRole = (user.user_metadata as { role?: string } | null)?.role;
    let allowed = OWNER_EMAILS.includes(email) || metaRole === "admin";

    if (!allowed) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      allowed = (roles ?? []).length > 0;
    }
    if (!allowed) throw redirect({ to: "/" });
    return { email };
  },
  component: AdminDashboard,
});

type Row = {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: string;
  created_at: string;
  queries: number;
  isAdmin: boolean;
};

type SymbolRow = {
  id: string;
  symbol: string;
  name_en: string;
  name_ar: string;
  sector: string;
  price: number;
  change_pct: number;
  indices: string[];
  is_active: boolean;
};

type Tab = "users" | "stocks" | "audit";

function AdminDashboard() {
  const { email } = Route.useRouteContext();
  const isSuperOwner = OWNER_EMAILS.includes((email ?? "").toLowerCase());
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="min-h-screen p-4 sm:p-6" dir="rtl">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="brand-text font-display text-xl font-black">لوحة تحكم المالك</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-bold"
        >
          <ArrowLeft className="size-3.5" /> العودة للتيرمينال
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          <Users className="size-3.5" /> 👥 إدارة المستخدمين والـ PRO
        </TabButton>
        <TabButton active={tab === "stocks"} onClick={() => setTab("stocks")}>
          <LineChart className="size-3.5" /> 📈 إدارة الأسهم والـ Symbols
        </TabButton>
        <TabButton active={tab === "audit"} onClick={() => setTab("audit")}>
          <Crown className="size-3.5" /> 🧾 سجل عمليات الإدارة
        </TabButton>
      </div>

      {tab === "users" && <UsersTab isSuperOwner={isSuperOwner} />}
      {tab === "stocks" && <StocksTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("id, actor_email, action, target_type, target_label, details, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      setRows((data ?? []) as AuditRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.actor_email ?? "").toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        (r.target_label ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <div className="glow-card rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 focus-within:border-primary">
        <Search className="size-4 text-primary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بمن نفّذ العملية أو نوعها أو الهدف…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {loading ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> جاري التحميل…
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 text-start">التاريخ والوقت</th>
                <th className="px-2 py-2 text-start">مَن نفّذ</th>
                <th className="px-2 py-2 text-start">العملية</th>
                <th className="px-2 py-2 text-start">الهدف</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-2 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("ar-EG")}
                  </td>
                  <td className="px-2 py-3 font-semibold">{r.actor_email ?? "—"}</td>
                  <td className="px-2 py-3 font-bold text-primary">
                    {AUDIT_LABELS[r.action as AuditAction] ?? r.action}
                  </td>
                  <td className="px-2 py-3">
                    <span className="block">{r.target_label ?? "—"}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.target_type}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    لا عمليات مسجلة بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition-colors ${
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-panel text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function UsersTab({ isSuperOwner }: { isSuperOwner: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const [profilesRes, usageRes, rolesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, display_name, plan, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("ai_usage").select("user_id, query_count").eq("usage_date", today),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);

    if (profilesRes.error) setError(profilesRes.error.message);
    const usage = new Map((usageRes.data ?? []).map((u) => [u.user_id, u.query_count ?? 0]));
    const admins = new Set((rolesRes.data ?? []).map((r) => r.user_id));

    setRows(
      (profilesRes.data ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        display_name: p.display_name,
        plan: p.plan ?? "free",
        created_at: p.created_at,
        queries: usage.get(p.id) ?? 0,
        isAdmin: admins.has(p.id),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.display_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totals = useMemo(
    () => ({
      users: rows.length,
      pro: rows.filter((r) => r.plan === "pro").length,
      queries: rows.reduce((sum, r) => sum + (r.queries || 0), 0),
    }),
    [rows],
  );

  function describeRpcError(code?: string) {
    switch (code) {
      case "not_authorized":
        return "هذه العملية متاحة للمشرفين والمالكين فقط.";
      case "user_not_found":
        return "لا يوجد حساب مؤكد بهذا البريد — يجب أن يسجّل الدخول مرة واحدة أولًا.";
      case "invalid_email":
        return "صيغة البريد غير صحيحة.";
      case "owner_protected":
      case "privileged_protected":
        return "لا يمكن سحب صلاحيات أو باقة حساب مالك/مشرف.";
      case "owner_only_demote":
        return "سحب صلاحيات Admin متاح لحسابات المالك فقط.";
      case "invalid_plan":
        return "باقة غير معروفة.";
      default:
        return "تعذر تنفيذ العملية.";
    }
  }

  async function setPlan(row: Row, nextPlan: "pro" | "free") {
    setBusyId(row.id);
    setError(null);
    // Server-side check: only admins/owners may change plans (public.admin_set_plan).
    const { data, error: err } = await supabase.rpc("admin_set_plan", {
      _user_id: row.id,
      _plan: nextPlan,
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (err) setError(err.message);
    else if (!res.ok) setError(describeRpcError(res.error));
    else setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, plan: nextPlan } : r)));
    setBusyId(null);
  }

  async function toggleAdmin(row: Row) {
    setBusyId(row.id);
    setError(null);
    const makeAdmin = !row.isAdmin;
    // Server-side check + audit: only admins may promote, only owners may demote.
    const { data, error: err } = await supabase.rpc("admin_set_role", {
      _user_id: row.id,
      _make_admin: makeAdmin,
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (err) setError(err.message);
    else if (!res.ok) setError(describeRpcError(res.error));
    else
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, isAdmin: makeAdmin, plan: makeAdmin ? "pro" : r.plan } : r,
        ),
      );
    setBusyId(null);
  }

  async function promoteByEmail() {
    const target = newAdmin.trim().toLowerCase();
    if (!target) return;
    setError(null);
    setBusyId("by-email");
    const { data, error: err } = await supabase.rpc("admin_set_role_by_email", {
      _email: target,
      _make_admin: true,
    });
    setBusyId(null);
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (err) {
      setError(err.message);
      return;
    }
    if (!res.ok) {
      setError(describeRpcError(res.error));
      return;
    }
    setNewAdmin("");
    await load();
  }

  return (
    <>
      <div className="glow-card mb-4 grid gap-3 rounded-2xl p-4 sm:grid-cols-3">
        <Stat label="إجمالي الحسابات" value={totals.users} />
        <Stat label="مشتركو PRO" value={totals.pro} />
        <Stat label="أسئلة AI اليوم" value={totals.queries} />
      </div>

      {isSuperOwner && (
        <div className="glow-card mb-4 rounded-2xl p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
            <UserPlus className="size-3.5" /> ترقية حساب إلى Admin بالبريد (يمنح PRO تلقائيًا)
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="name@gmail.com"
              className="min-w-0 flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <Button onClick={() => void promoteByEmail()} className="font-bold">
              تعيين Admin
            </Button>
          </div>
        </div>
      )}

      <div className="glow-card rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 focus-within:border-primary">
          <Search className="size-4 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالبريد أو الاسم…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {error && (
          <p className="mb-3 rounded-xl border border-bear/40 bg-bear/10 p-3 text-xs text-bear">
            {error}
          </p>
        )}

        {loading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري التحميل…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 text-start">البريد</th>
                  <th className="px-2 py-2 text-start">تاريخ التسجيل</th>
                  <th className="px-2 py-2 text-start">الصلاحية</th>
                  <th className="px-2 py-2 text-start">الخطة</th>
                  <th className="px-2 py-2 text-center">أسئلة AI اليوم</th>
                  <th className="px-2 py-2 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="px-2 py-3">
                      <span className="block font-semibold">{row.email ?? "—"}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {row.display_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          row.isAdmin
                            ? "border border-bull/40 bg-bull/15 text-bull"
                            : "border border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        {row.isAdmin ? "ADMIN 👑 (PRO ACTIVE)" : "User"}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          row.plan === "pro"
                            ? "border border-primary/40 bg-primary/15 text-primary"
                            : "border border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        {row.plan === "pro" ? "PRO" : "Free"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center font-bold">{row.queries}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={row.plan === "pro" ? "secondary" : "default"}
                          disabled={busyId === row.id}
                          onClick={() => void setPlan(row, row.plan === "pro" ? "free" : "pro")}
                          className="font-bold"
                        >
                          {busyId === row.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : row.plan === "pro" ? (
                            <>
                              <Lock className="size-3.5" /> Revoke PRO 🔒
                            </>
                          ) : (
                            <>
                              <Unlock className="size-3.5" /> Grant PRO (Free) 🔓
                            </>
                          )}
                        </Button>
                        {isSuperOwner && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === row.id}
                            onClick={() => void toggleAdmin(row)}
                            className="font-bold"
                          >
                            {row.isAdmin ? (
                              <ShieldMinus className="size-3.5" />
                            ) : (
                              <ShieldCheck className="size-3.5" />
                            )}
                            {row.isAdmin ? "إزالة Admin" : "تعيين Admin"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      لا نتائج مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

const emptyDraft = {
  symbol: "",
  name_en: "",
  name_ar: "",
  sector: "Other",
  price: "0",
  change_pct: "0",
  indices: "EGX100",
};

function StocksTab() {
  const [rows, setRows] = useState<SymbolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState(emptyDraft);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("stock_symbols")
      .select("id, symbol, name_en, name_ar, sector, price, change_pct, indices, is_active")
      .order("symbol");
    if (err) setError(err.message);
    setRows(
      (data ?? []).map((r) => ({
        ...r,
        price: Number(r.price ?? 0),
        change_pct: Number(r.change_pct ?? 0),
        indices: r.indices ?? [],
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name_en.toLowerCase().includes(q) ||
        r.name_ar.includes(query.trim()) ||
        r.sector.toLowerCase().includes(q),
    );
  }, [rows, query]);

  function toPayload(d: typeof emptyDraft) {
    return {
      symbol: d.symbol.trim().toUpperCase(),
      name_en: d.name_en.trim(),
      name_ar: d.name_ar.trim(),
      sector: d.sector.trim() || "Other",
      price: Number(d.price) || 0,
      change_pct: Number(d.change_pct) || 0,
      indices: d.indices
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    };
  }

  async function addSymbol() {
    const payload = toPayload(draft);
    if (!payload.symbol || !payload.name_en || !payload.name_ar) {
      setError("الرمز والاسم بالعربي والإنجليزي مطلوبون.");
      return;
    }
    setBusy("new");
    setError(null);
    const { error: err } = await supabase.from("stock_symbols").insert(payload);
    if (err) setError(err.message);
    else {
      void logAdminAction({
        action: "symbol_add",
        targetType: "symbol",
        targetLabel: payload.symbol,
        details: payload,
      });
      setDraft(emptyDraft);
      await load();
    }
    setBusy(null);
  }

  async function saveEdit(id: string) {
    setBusy(id);
    setError(null);
    const payload = toPayload(edit);
    const { error: err } = await supabase.from("stock_symbols").update(payload).eq("id", id);
    if (err) setError(err.message);
    else {
      void logAdminAction({
        action: "symbol_edit",
        targetType: "symbol",
        targetId: id,
        targetLabel: payload.symbol,
        details: payload,
      });
      setEditId(null);
      await load();
    }
    setBusy(null);
  }

  async function toggleActive(row: SymbolRow) {
    setBusy(row.id);
    const { error: err } = await supabase
      .from("stock_symbols")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (err) setError(err.message);
    else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)));
      void logAdminAction({
        action: "symbol_toggle",
        targetType: "symbol",
        targetId: row.id,
        targetLabel: row.symbol,
        details: { is_active: !row.is_active },
      });
    }
    setBusy(null);
  }

  return (
    <>
      <div className="glow-card mb-4 grid gap-3 rounded-2xl p-4 sm:grid-cols-3">
        <Stat label="إجمالي الرموز" value={rows.length} />
        <Stat label="رموز EGX30" value={rows.filter((r) => r.indices.includes("EGX30")).length} />
        <Stat label="رموز EGX70" value={rows.filter((r) => r.indices.includes("EGX70")).length} />
      </div>

      <div className="glow-card mb-4 rounded-2xl p-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
          <Plus className="size-3.5" /> إضافة سهم جديد
        </p>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <Field
            placeholder="COMI"
            value={draft.symbol}
            onChange={(v) => setDraft({ ...draft, symbol: v })}
          />
          <Field
            placeholder="English name"
            value={draft.name_en}
            onChange={(v) => setDraft({ ...draft, name_en: v })}
          />
          <Field
            placeholder="الاسم بالعربي"
            value={draft.name_ar}
            onChange={(v) => setDraft({ ...draft, name_ar: v })}
          />
          <Field
            placeholder="Sector"
            value={draft.sector}
            onChange={(v) => setDraft({ ...draft, sector: v })}
          />
          <Field
            placeholder="السعر"
            value={draft.price}
            onChange={(v) => setDraft({ ...draft, price: v })}
          />
          <Field
            placeholder="التغير %"
            value={draft.change_pct}
            onChange={(v) => setDraft({ ...draft, change_pct: v })}
          />
          <Field
            placeholder="EGX30,EGX100"
            value={draft.indices}
            onChange={(v) => setDraft({ ...draft, indices: v })}
          />
        </div>
        <Button
          onClick={() => void addSymbol()}
          disabled={busy === "new"}
          className="mt-3 font-bold"
        >
          {busy === "new" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}{" "}
          إضافة الرمز
        </Button>
      </div>

      <div className="glow-card rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 focus-within:border-primary">
          <Search className="size-4 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالرمز أو الاسم العربي/الإنجليزي أو القطاع…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {error && (
          <p className="mb-3 rounded-xl border border-bear/40 bg-bear/10 p-3 text-xs text-bear">
            {error}
          </p>
        )}

        {loading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري التحميل…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 text-start">الرمز</th>
                  <th className="px-2 py-2 text-start">الاسم</th>
                  <th className="px-2 py-2 text-start">القطاع</th>
                  <th className="px-2 py-2 text-center">السعر</th>
                  <th className="px-2 py-2 text-center">التغير %</th>
                  <th className="px-2 py-2 text-start">المؤشرات</th>
                  <th className="px-2 py-2 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) =>
                  editId === row.id ? (
                    <tr key={row.id} className="border-t border-border/60 bg-secondary/20">
                      <td className="px-2 py-3">
                        <Field
                          value={edit.symbol}
                          onChange={(v) => setEdit({ ...edit, symbol: v })}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="grid gap-1">
                          <Field
                            value={edit.name_en}
                            onChange={(v) => setEdit({ ...edit, name_en: v })}
                          />
                          <Field
                            value={edit.name_ar}
                            onChange={(v) => setEdit({ ...edit, name_ar: v })}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <Field
                          value={edit.sector}
                          onChange={(v) => setEdit({ ...edit, sector: v })}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Field
                          value={edit.price}
                          onChange={(v) => setEdit({ ...edit, price: v })}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Field
                          value={edit.change_pct}
                          onChange={(v) => setEdit({ ...edit, change_pct: v })}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Field
                          value={edit.indices}
                          onChange={(v) => setEdit({ ...edit, indices: v })}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={busy === row.id}
                            onClick={() => void saveEdit(row.id)}
                            className="font-bold"
                          >
                            {busy === row.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Save className="size-3.5" />
                            )}{" "}
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditId(null)}
                            className="font-bold"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} className="border-t border-border/60">
                      <td className="px-2 py-3 font-black text-primary">{row.symbol}</td>
                      <td className="px-2 py-3">
                        <span className="block font-semibold">{row.name_ar}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {row.name_en}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">{row.sector}</td>
                      <td className="px-2 py-3 text-center font-bold">{row.price.toFixed(2)}</td>
                      <td
                        className={`px-2 py-3 text-center font-bold ${row.change_pct >= 0 ? "text-bull" : "text-bear"}`}
                      >
                        {row.change_pct >= 0 ? "+" : ""}
                        {row.change_pct.toFixed(2)}%
                      </td>
                      <td className="px-2 py-3 text-[11px] text-muted-foreground">
                        {row.indices.join(" · ")}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="font-bold"
                            onClick={() => {
                              setEditId(row.id);
                              setEdit({
                                symbol: row.symbol,
                                name_en: row.name_en,
                                name_ar: row.name_ar,
                                sector: row.sector,
                                price: String(row.price),
                                change_pct: String(row.change_pct),
                                indices: row.indices.join(","),
                              });
                            }}
                          >
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant={row.is_active ? "secondary" : "default"}
                            disabled={busy === row.id}
                            onClick={() => void toggleActive(row)}
                            className="font-bold"
                          >
                            {row.is_active ? "إيقاف" : "تنشيط"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      لا رموز مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Field({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-w-0 w-full rounded-lg border border-border bg-secondary/40 px-2.5 py-2 text-xs outline-none focus:border-primary"
    />
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-2xl font-black text-primary">
        {Number.isFinite(value) ? value : 0}
      </p>
    </div>
  );
}
