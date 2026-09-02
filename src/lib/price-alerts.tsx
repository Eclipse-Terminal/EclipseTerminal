import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cleanPriceSymbol, useLivePrices } from "@/lib/live-prices";

export type AlertKind = "target" | "stop";

export type PriceAlert = {
  id: string;
  symbol: string;
  kind: AlertKind;
  threshold: number;
  is_active: boolean;
  repeat_alert: boolean;
  notify_in_app: boolean;
  notify_browser: boolean;
  note: string | null;
  last_triggered_at: string | null;
  last_triggered_price: number | null;
};

export type NewAlert = {
  symbol: string;
  kind: AlertKind;
  threshold: number;
  repeat_alert?: boolean;
  notify_in_app?: boolean;
  notify_browser?: boolean;
  note?: string | null;
};

type AlertsState = {
  alerts: PriceAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createAlert: (input: NewAlert) => Promise<boolean>;
  updateAlert: (id: string, patch: Partial<NewAlert> & { is_active?: boolean }) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
  /** Browser notification permission state, "unsupported" outside browsers. */
  notifyPermission: string;
  requestNotifications: () => Promise<void>;
  /** Re-reads the live browser permission state (after the user changes it in site settings). */
  refreshPermission: () => string;
};

const AlertsCtx = createContext<AlertsState | null>(null);

const SELECT =
  "id, symbol, kind, threshold, is_active, repeat_alert, notify_in_app, notify_browser, note, last_triggered_at, last_triggered_price";

/** An alert fires when price crosses the level in the direction of its kind. */
export function alertHit(kind: AlertKind, threshold: number, price: number) {
  return kind === "target" ? price >= threshold : price <= threshold;
}

/** Alerts already fired today are not repeated unless repeat_alert is on. */
function alreadyFired(alert: PriceAlert) {
  if (alert.repeat_alert) return false;
  return Boolean(alert.last_triggered_at);
}

export function PriceAlertsProvider({ children }: { children: ReactNode }) {
  const { priceOf, updatedAt } = useLivePrices();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyPermission, setNotifyPermission] = useState("unsupported");
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("price_alerts")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else {
      setError(null);
      setAlerts((data ?? []) as PriceAlert[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifyPermission(result);
  }, []);

  const refreshPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifyPermission("unsupported");
      return "unsupported";
    }
    const current = Notification.permission as string;
    setNotifyPermission(current);
    return current;
  }, []);

  const createAlert = useCallback(async (input: NewAlert) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setError("يجب تسجيل الدخول لإضافة تنبيه.");
      return false;
    }
    const { data, error: err } = await supabase
      .from("price_alerts")
      .insert({
        user_id: user.id,
        symbol: cleanPriceSymbol(input.symbol),
        kind: input.kind,
        threshold: input.threshold,
        repeat_alert: input.repeat_alert ?? false,
        notify_in_app: input.notify_in_app ?? true,
        notify_browser: input.notify_browser ?? true,
        note: input.note ?? null,
      })
      .select(SELECT)
      .maybeSingle();
    if (err) {
      setError(err.message);
      return false;
    }
    setError(null);
    if (data) setAlerts((prev) => [data as PriceAlert, ...prev]);
    return true;
  }, []);

  const updateAlert = useCallback(
    async (id: string, patch: Partial<NewAlert> & { is_active?: boolean }) => {
      const { data, error: err } = await supabase
        .from("price_alerts")
        .update(patch)
        .eq("id", id)
        .select(SELECT)
        .maybeSingle();
      if (err) {
        setError(err.message);
        return;
      }
      if (data) setAlerts((prev) => prev.map((a) => (a.id === id ? (data as PriceAlert) : a)));
    },
    [],
  );

  const removeAlert = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("price_alerts").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    firedRef.current.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  /** Evaluate every active rule against the freshest auto-refreshed prices. */
  useEffect(() => {
    if (alerts.length === 0) return;
    const hits: { alert: PriceAlert; price: number }[] = [];

    for (const alert of alerts) {
      if (!alert.is_active) continue;
      const price = priceOf(alert.symbol);
      if (!price) continue;
      if (!alertHit(alert.kind, Number(alert.threshold), price)) continue;
      if (alreadyFired(alert)) continue;
      if (firedRef.current.has(alert.id)) continue;
      firedRef.current.add(alert.id);
      hits.push({ alert, price });
    }

    if (hits.length === 0) return;

    for (const { alert, price } of hits) {
      const title =
        alert.kind === "target"
          ? `🎯 هدف ${alert.symbol} تحقق عند ${price.toFixed(2)} EGP`
          : `🛑 وقف خسارة ${alert.symbol} عند ${price.toFixed(2)} EGP`;
      const body = `المستوى المحدد: ${Number(alert.threshold).toFixed(2)} EGP${alert.note ? ` · ${alert.note}` : ""}`;

      if (alert.notify_in_app !== false) {
        if (alert.kind === "target") toast.success(title, { description: body, duration: 10_000 });
        else toast.error(title, { description: body, duration: 10_000 });
      }

      if (
        alert.notify_browser !== false &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body });
        } catch {
          /* notification failures must never break the terminal */
        }
      }

      void supabase
        .from("price_alerts")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_triggered_price: price,
          is_active: alert.repeat_alert,
        })
        .eq("id", alert.id);
    }

    setAlerts((prev) =>
      prev.map((a) => {
        const hit = hits.find((h) => h.alert.id === a.id);
        if (!hit) return a;
        return {
          ...a,
          last_triggered_at: new Date().toISOString(),
          last_triggered_price: hit.price,
          is_active: a.repeat_alert,
        };
      }),
    );
  }, [alerts, priceOf, updatedAt]);

  const value = useMemo<AlertsState>(
    () => ({
      alerts,
      loading,
      error,
      refresh,
      createAlert,
      updateAlert,
      removeAlert,
      notifyPermission,
      requestNotifications,
      refreshPermission,
    }),
    [
      alerts,
      loading,
      error,
      refresh,
      createAlert,
      updateAlert,
      removeAlert,
      notifyPermission,
      requestNotifications,
      refreshPermission,
    ],
  );

  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>;
}

export function usePriceAlerts() {
  const ctx = useContext(AlertsCtx);
  if (!ctx) throw new Error("usePriceAlerts must be used inside <PriceAlertsProvider>");
  return ctx;
}
