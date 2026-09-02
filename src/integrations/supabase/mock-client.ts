// Mock Supabase Client for offline / dev preview environments when external Supabase keys are not set
import type { Database } from "./types";

export const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "sohailelnaggar551@gmail.com",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  phone: "",
  confirmed_at: "2026-01-01T00:00:00Z",
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Sohail Elnaggar" },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: new Date().toISOString(),
};

export const DEMO_SESSION = {
  access_token: "mock-jwt-access-token-demo",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-refresh-token",
  user: DEMO_USER,
};

type AuthListener = (event: string, session: typeof DEMO_SESSION | null) => void;
const listeners = new Set<AuthListener>();

type GenericRow = Record<string, unknown>;

function safeGetStorage(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota errors
  }
}

function safeRemoveStorage(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

function getCurrentUser() {
  if (typeof window === "undefined") return DEMO_USER;
  const loggedOut = safeGetStorage("egx_auth_logged_out");
  if (loggedOut === "true") return null;

  const stored = safeGetStorage("egx_auth_user");
  if (stored) {
    try {
      return JSON.parse(stored) as typeof DEMO_USER;
    } catch {
      // fallback
    }
  }
  return DEMO_USER;
}

function getCurrentSession() {
  const user = getCurrentUser();
  if (!user) return null;
  return {
    ...DEMO_SESSION,
    user,
  };
}

function notifyAuth(event: string) {
  const session = getCurrentSession();
  listeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch (e) {
      console.error("[mock-auth] listener error", e);
    }
  });
}

function getTableData(table: string): GenericRow[] {
  const raw = safeGetStorage(`egx_mock_table_${table}`);
  if (raw) {
    try {
      return JSON.parse(raw) as GenericRow[];
    } catch {
      // fallback
    }
  }

  // Initial table seeds
  if (table === "price_alerts") {
    const defaultAlerts = [
      {
        id: "alert-1",
        symbol: "COMI",
        target_price: 95.0,
        condition: "above",
        active: true,
        triggered: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "alert-2",
        symbol: "FWRY",
        target_price: 7.0,
        condition: "below",
        active: true,
        triggered: false,
        created_at: new Date().toISOString(),
      },
    ];
    safeSetStorage(`egx_mock_table_${table}`, JSON.stringify(defaultAlerts));
    return defaultAlerts;
  }

  if (table === "chat_threads") {
    const defaultThreads = [
      {
        id: "thread-egx-welcome",
        title: "تحليل سهم التجاري الدولي (COMI)",
        updated_at: new Date().toISOString(),
      },
    ];
    safeSetStorage(`egx_mock_table_${table}`, JSON.stringify(defaultThreads));
    return defaultThreads;
  }

  if (table === "chat_messages") {
    const defaultMessages = [
      {
        id: "msg-1",
        thread_id: "thread-egx-welcome",
        role: "user",
        parts: [{ type: "text", text: "تحليل سهم التجاري الدولي" }],
        content: "تحليل سهم التجاري الدولي",
        created_at: new Date().toISOString(),
      },
      {
        id: "msg-2",
        thread_id: "thread-egx-welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "📌 **تحليل سهم البنك التجاري الدولي (COMI)**\n\n• **السعر الحالي:** 92.40 ج.م (+2.10%)\n• **الاتجاه العام:** صاعد بقوة\n\n🛡️ **مستويات الدعم والمقاومة:**\n• **الدعم 1:** 89.50 | **الدعم 2:** 87.00\n• **المقاومة 1:** 94.00 | **المقاومة 2:** 96.50\n\n💡 **الرؤية الفنية:**\nالسهم يختبر منطقة المقاومة الرئيسية مصحوباً بأحجام تداول جيدة. اختراق 94.00 يفتح الطريق لمستهدفات أعلى.",
          },
        ],
        content: "تحليل سهم البنك التجاري الدولي (COMI)",
        created_at: new Date(Date.now() + 1000).toISOString(),
      },
    ];
    safeSetStorage(`egx_mock_table_${table}`, JSON.stringify(defaultMessages));
    return defaultMessages;
  }

  return [];
}

function setTableData(table: string, items: GenericRow[]) {
  safeSetStorage(`egx_mock_table_${table}`, JSON.stringify(items));
}

class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: GenericRow) => boolean> = [];
  private sortFn: ((a: GenericRow, b: GenericRow) => number) | null = null;
  private limitCount: number | null = null;
  private pendingInsert: GenericRow | GenericRow[] | null = null;
  private pendingUpdate: GenericRow | null = null;
  private isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    return this;
  }

  insert(values: GenericRow | GenericRow[]) {
    this.pendingInsert = values;
    return this;
  }

  update(values: GenericRow) {
    this.pendingUpdate = values;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push((item) => item[col] === val);
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false;
    this.sortFn = (a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return asc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private execute() {
    const user = getCurrentUser();

    if (this.table === "profiles") {
      const profile = {
        id: user?.id ?? "00000000-0000-0000-0000-000000000001",
        email: user?.email ?? "sohailelnaggar551@gmail.com",
        plan: "pro",
        plan_expires_at: "2099-01-01T00:00:00Z",
      };
      return { data: profile, error: null };
    }

    if (this.table === "user_roles") {
      return { data: [{ role: "admin" }], error: null };
    }

    if (this.table === "payments") {
      if (this.pendingInsert) {
        const row = {
          id: `pay_${Date.now()}`,
          status: "pending",
          ...(Array.isArray(this.pendingInsert) ? this.pendingInsert[0] : this.pendingInsert),
        };
        return { data: row, error: null };
      }
      return { data: null, error: null };
    }

    if (this.table === "admin_audit_log") {
      return { data: null, error: null };
    }

    let items = getTableData(this.table);

    if (this.pendingInsert) {
      const toInsert = Array.isArray(this.pendingInsert)
        ? this.pendingInsert
        : [this.pendingInsert];
      const inserted = toInsert.map((item) => ({
        id: item["id"] || `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      }));
      items = [...items, ...inserted];
      setTableData(this.table, items);
      return { data: Array.isArray(this.pendingInsert) ? inserted : inserted[0], error: null };
    }

    if (this.pendingUpdate) {
      let updatedFirst: GenericRow | null = null;
      items = items.map((item) => {
        const matches = this.filters.every((f) => f(item));
        if (matches) {
          const updated = { ...item, ...this.pendingUpdate, updated_at: new Date().toISOString() };
          if (!updatedFirst) updatedFirst = updated;
          return updated;
        }
        return item;
      });
      setTableData(this.table, items);
      return { data: updatedFirst, error: null };
    }

    if (this.isDelete) {
      items = items.filter((item) => !this.filters.every((f) => f(item)));
      setTableData(this.table, items);
      return { data: null, error: null };
    }

    let result = items;
    for (const f of this.filters) {
      result = result.filter(f);
    }
    if (this.sortFn) {
      result = [...result].sort(this.sortFn);
    }
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    return { data: result, error: null };
  }

  async single() {
    const res = this.execute();
    if (Array.isArray(res.data)) {
      return { data: res.data[0] ?? null, error: res.data[0] ? null : { message: "Not found" } };
    }
    return res;
  }

  async maybeSingle() {
    const res = this.execute();
    if (Array.isArray(res.data)) {
      return { data: res.data[0] ?? null, error: null };
    }
    return res;
  }

  // Promise-like behavior so `await supabase.from(...)` works seamlessly
  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const res = this.execute();
    return Promise.resolve(res).then(onfulfilled, onrejected);
  }
}

type Holding = { symbol: string; shares: number; avg_price: number };
type Trade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  created_at: string;
};
type Portfolio = {
  cash: number;
  starting_balance: number;
  holdings: Holding[];
  trades: Trade[];
};

function getPaperPortfolio(): Portfolio {
  const raw = safeGetStorage("egx_mock_paper_portfolio");
  if (raw) {
    try {
      return JSON.parse(raw) as Portfolio;
    } catch {
      // fallback
    }
  }

  const defaultPortfolio: Portfolio = {
    cash: 100000,
    starting_balance: 100000,
    holdings: [
      { symbol: "COMI", shares: 500, avg_price: 88.5 },
      { symbol: "FWRY", shares: 3000, avg_price: 7.2 },
      { symbol: "TMGH", shares: 600, avg_price: 54.0 },
    ],
    trades: [
      {
        id: "trade-1",
        symbol: "COMI",
        side: "buy",
        shares: 500,
        price: 88.5,
        total: 44250,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "trade-2",
        symbol: "FWRY",
        side: "buy",
        shares: 3000,
        price: 7.2,
        total: 21600,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
  safeSetStorage("egx_mock_paper_portfolio", JSON.stringify(defaultPortfolio));
  return defaultPortfolio;
}

function executePaperTrade(args: {
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
}) {
  const p = getPaperPortfolio();
  const total = args.shares * args.price;

  if (args.side === "buy") {
    if (p.cash < total) {
      return { error: { message: "السيولة النقدية المتاحة لا تكفي لتنفيذ العملية." } };
    }
    p.cash -= total;
    const existing = p.holdings.find((h) => h.symbol === args.symbol);
    if (existing) {
      const oldTotal = existing.shares * existing.avg_price;
      existing.shares += args.shares;
      existing.avg_price = (oldTotal + total) / existing.shares;
    } else {
      p.holdings.push({ symbol: args.symbol, shares: args.shares, avg_price: args.price });
    }
  } else {
    const existing = p.holdings.find((h) => h.symbol === args.symbol);
    if (!existing || existing.shares < args.shares) {
      return { error: { message: "لا تملك أسهماً كافية لتنفيذ عملية البيع." } };
    }
    p.cash += total;
    existing.shares -= args.shares;
    if (existing.shares === 0) {
      p.holdings = p.holdings.filter((h) => h.symbol !== args.symbol);
    }
  }

  p.trades.unshift({
    id: `trade-${Date.now()}`,
    symbol: args.symbol,
    side: args.side,
    shares: args.shares,
    price: args.price,
    total,
    created_at: new Date().toISOString(),
  });

  safeSetStorage("egx_mock_paper_portfolio", JSON.stringify(p));
  return { data: { ok: true, portfolio: p }, error: null };
}

export function createMockSupabaseClient() {
  return {
    auth: {
      async getUser() {
        const user = getCurrentUser();
        return { data: { user }, error: null };
      },
      async getSession() {
        const session = getCurrentSession();
        return { data: { session }, error: null };
      },
      async getClaims(_token?: string) {
        const user = getCurrentUser() || DEMO_USER;
        return {
          data: {
            claims: {
              sub: user.id,
              email: user.email,
              role: user.role,
            },
          },
          error: null,
        };
      },
      onAuthStateChange(callback: AuthListener) {
        listeners.add(callback);
        // Dispatch current initial state asynchronously
        setTimeout(() => {
          const session = getCurrentSession();
          callback(session ? "INITIAL_SESSION" : "SIGNED_OUT", session);
        }, 0);

        return {
          data: {
            subscription: {
              unsubscribe() {
                listeners.delete(callback);
              },
            },
          },
        };
      },
      async signInWithPassword({ email }: { email: string; password?: string }) {
        const user = {
          ...DEMO_USER,
          email,
          user_metadata: { full_name: email.split("@")[0] },
        };
        safeSetStorage("egx_auth_user", JSON.stringify(user));
        safeRemoveStorage("egx_auth_logged_out");
        notifyAuth("SIGNED_IN");
        return { data: { user, session: { ...DEMO_SESSION, user } }, error: null };
      },
      async signUp({
        email,
        options,
      }: {
        email: string;
        password?: string;
        options?: { data?: { full_name?: string } };
      }) {
        const user = {
          ...DEMO_USER,
          email,
          user_metadata: { full_name: options?.data?.full_name || email.split("@")[0] },
        };
        safeSetStorage("egx_auth_user", JSON.stringify(user));
        safeRemoveStorage("egx_auth_logged_out");
        notifyAuth("SIGNED_IN");
        return { data: { user, session: { ...DEMO_SESSION, user } }, error: null };
      },
      async signOut() {
        safeSetStorage("egx_auth_logged_out", "true");
        safeRemoveStorage("egx_auth_user");
        notifyAuth("SIGNED_OUT");
        return { error: null };
      },
      async resetPasswordForEmail() {
        return { data: {}, error: null };
      },
    },

    from(table: string) {
      return new MockQueryBuilder(table);
    },

    async rpc(
      fnName: string,
      args?: { symbol: string; side: "buy" | "sell"; shares: number; price: number },
    ) {
      if (fnName === "paper_portfolio") {
        return { data: getPaperPortfolio(), error: null };
      }
      if (fnName === "paper_trade" && args) {
        return executePaperTrade(args);
      }
      if (fnName === "ai_quota_status") {
        return {
          data: {
            plan: "pro",
            used: 0,
            limit: null,
            allowed: true,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
  } as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient<Database>>;
}
