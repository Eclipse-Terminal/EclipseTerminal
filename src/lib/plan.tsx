import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export const FREE_DAILY_LIMIT = 3;
export const PRICE_MONTHLY_EGP = 199;
export const PRICE_YEARLY_EGP = 1990;

export type Plan = "free" | "pro";

export type QuotaState = {
  plan: Plan;
  used: number;
  limit: number | null;
  allowed: boolean;
};

type AccountState = {
  loading: boolean;
  email: string | null;
  userId: string | null;
  plan: Plan;
  isPro: boolean;
  isAdmin: boolean;
  isSuperOwner: boolean;
  quota: QuotaState;
  refresh: () => Promise<void>;
  /** Reserves one AI query. Returns false when the free cap is reached. */
  consumeQuery: () => Promise<boolean>;
  upgradeOpen: boolean;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
  upgradeReason: string | null;
};

const OWNER_EMAILS = [
  "sohailelnaggar551@gmail.com",
  "yasserxhacker@gmail.com",
  "montasserelnaggar69@gmail.com",
];

const AccountContext = createContext<AccountState | null>(null);

const emptyQuota: QuotaState = { plan: "free", used: 0, limit: FREE_DAILY_LIMIT, allowed: true };

function normalizeQuota(raw: unknown): QuotaState {
  const q = (raw ?? {}) as Record<string, unknown>;
  const plan = q.plan === "pro" ? "pro" : "free";
  return {
    plan,
    used: typeof q.used === "number" ? q.used : 0,
    limit: plan === "pro" ? null : FREE_DAILY_LIMIT,
    allowed: q.allowed !== false,
  };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const [quota, setQuota] = useState<QuotaState>(emptyQuota);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [owner, setOwner] = useState(false);
  const privileged = isAdmin || owner;

  const refresh = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);
    setOwner(OWNER_EMAILS.includes((user.email ?? "").toLowerCase()));

    const [profileRes, rolesRes, quotaRes] = await Promise.all([
      supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.rpc("ai_quota_status"),
    ]);

    const admin = (rolesRes.data ?? []).some((r) => r.role === "admin");
    const owner = OWNER_EMAILS.includes((user.email ?? "").toLowerCase());
    // Rule: admins and owners are always PRO. Regular users keep their real plan.
    const nextPlan: Plan = admin || owner || profileRes.data?.plan === "pro" ? "pro" : "free";
    setPlan(nextPlan);
    setIsAdmin(admin || owner);
    setQuota(
      admin || owner
        ? { plan: "pro", used: 0, limit: null, allowed: true }
        : normalizeQuota(quotaRes.data),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const consumeQuery = useCallback(async () => {
    if (privileged) return true; // admins/owners: unlimited AI queries, no paywall
    const { data, error } = await supabase.rpc("consume_ai_query");
    if (error) {
      console.error("[plan] consume_ai_query", error);
      return false;
    }
    const next = normalizeQuota(data);
    setQuota(next);
    setPlan(next.plan);
    if (!next.allowed) {
      setUpgradeReason("limit");
      setUpgradeOpen(true);
    }
    return next.allowed;
  }, [privileged]);

  const openUpgrade = useCallback((reason?: string) => {
    setUpgradeReason(reason ?? "feature");
    setUpgradeOpen(true);
  }, []);

  const value = useMemo<AccountState>(
    () => ({
      loading,
      email,
      userId,
      plan,
      isPro: privileged || plan === "pro",
      isAdmin,
      isSuperOwner: owner,
      quota,
      refresh,
      consumeQuery,
      upgradeOpen,
      openUpgrade,
      closeUpgrade: () => setUpgradeOpen(false),
      upgradeReason,
    }),
    [
      loading,
      email,
      userId,
      plan,
      isAdmin,
      privileged,
      owner,
      quota,
      refresh,
      consumeQuery,
      upgradeOpen,
      openUpgrade,
      upgradeReason,
    ],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}
