import { useMemo, useState } from "react";
import { Bell, BellRing, Loader2, Plus, Repeat, Target, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationSettingsDialog } from "@/components/modules/NotificationSettingsDialog";
import { STOCKS, fmt } from "@/lib/egx-data";
import { formatUpdatedAt, useLivePrices } from "@/lib/live-prices";
import { alertHit, usePriceAlerts, type AlertKind } from "@/lib/price-alerts";
import { useWatchlist } from "@/lib/watchlist";

export function PriceAlerts() {
  const {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    removeAlert,
    notifyPermission,
    requestNotifications,
  } = usePriceAlerts();
  const { priceOf, updatedAt, intervalMs } = useLivePrices();
  const { list } = useWatchlist();

  const symbols = useMemo(() => {
    const watch = list.map((s) => s.replace("EGX:", "").replace(".CA", "").toUpperCase());
    const rest = STOCKS.map((s) => s.symbol).filter((s) => !watch.includes(s));
    return [...watch, ...rest];
  }, [list]);

  const [symbol, setSymbol] = useState(symbols[0] ?? "COMI");
  const [kind, setKind] = useState<AlertKind>("target");
  const [threshold, setThreshold] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const currentPrice = priceOf(symbol);

  async function submit() {
    const value = parseFloat(threshold);
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    const ok = await createAlert({
      symbol,
      kind,
      threshold: value,
      repeat_alert: repeat,
      note: note || null,
    });
    setSaving(false);
    if (ok) {
      setThreshold("");
      setNote("");
    }
  }

  return (
    <div className="tab-fade space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel/60 px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          التنبيهات تُقاس على الأسعار المُحدَّثة تلقائيًا كل {Math.round(intervalMs / 1000)} ثانية ·
          آخر تحديث:{" "}
          <span className="font-bold tabular-nums text-foreground">
            {formatUpdatedAt(updatedAt)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {notifyPermission === "default" && (
            <Button
              size="sm"
              variant="secondary"
              className="font-bold"
              onClick={() => void requestNotifications()}
            >
              <BellRing className="size-3.5" /> تشغيل إشعارات المتصفح
            </Button>
          )}
          <NotificationSettingsDialog />
        </div>
      </div>

      <section className="glow-card rounded-2xl p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black">
          <Plus className="size-4 text-primary" /> قاعدة تنبيه جديدة
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">السهم</span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">نوع القاعدة</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AlertKind)}
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="target">🎯 هدف صاعد (السعر ≥ المستوى)</option>
              <option value="stop">🛑 وقف خسارة (السعر ≤ المستوى)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              المستوى (EGP) · السعر الحالي {fmt(currentPrice)}
            </span>
            <input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              inputMode="decimal"
              placeholder={fmt(currentPrice)}
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">ملاحظة (اختياري)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="سبب القاعدة أو خطة التنفيذ"
              className="mt-1.5 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setRepeat((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition-colors ${
                repeat
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              <Repeat className="size-3.5" /> متكرر
            </button>
            <Button onClick={() => void submit()} disabled={saving} className="flex-1 font-bold">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{" "}
              إضافة
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-bear/40 bg-bear/10 p-3 text-xs text-bear">{error}</p>
      )}

      <section className="glow-card overflow-x-auto rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black">
          <Bell className="size-4 text-primary" /> قواعد التنبيه ({alerts.length})
        </h3>
        {loading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري التحميل…
          </p>
        ) : alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا قواعد بعد — أضف هدفًا أو وقف خسارة لأسهم قائمة المتابعة.
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2 text-start">الرمز</th>
                <th className="px-2 py-2 text-start">النوع</th>
                <th className="px-2 py-2 text-end">المستوى</th>
                <th className="px-2 py-2 text-end">السعر الحالي</th>
                <th className="px-2 py-2 text-end">المسافة</th>
                <th className="px-2 py-2 text-start">الحالة</th>
                <th className="px-2 py-2 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => {
                const price = priceOf(a.symbol);
                const level = Number(a.threshold);
                const distPct = price > 0 ? ((level - price) / price) * 100 : 0;
                const hit = price > 0 && alertHit(a.kind, level, price);
                return (
                  <tr key={a.id} className="border-t border-border/60">
                    <td className="px-2 py-3 font-black text-primary">{a.symbol}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
                          a.kind === "target"
                            ? "border border-bull/40 bg-bull/15 text-bull"
                            : "border border-bear/40 bg-bear/15 text-bear"
                        }`}
                      >
                        {a.kind === "target" ? (
                          <Target className="size-3" />
                        ) : (
                          <TriangleAlert className="size-3" />
                        )}
                        {a.kind === "target" ? "هدف" : "وقف"}
                      </span>
                      {a.repeat_alert && (
                        <span className="ms-1 text-[10px] font-bold text-muted-foreground">
                          متكرر
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-end tabular-nums">{fmt(level)}</td>
                    <td className="px-2 py-3 text-end tabular-nums">{fmt(price)}</td>
                    <td
                      className={`px-2 py-3 text-end tabular-nums ${distPct >= 0 ? "text-bull" : "text-bear"}`}
                    >
                      {distPct >= 0 ? "+" : ""}
                      {fmt(distPct)}%
                    </td>
                    <td className="px-2 py-3">
                      <span className="block text-[11px] font-bold">
                        {hit ? "🔔 تحقق الشرط" : a.is_active ? "نشط — قيد المراقبة" : "موقوف"}
                      </span>
                      {a.last_triggered_at && (
                        <span className="block text-[10px] text-muted-foreground">
                          آخر تنبيه: {new Date(a.last_triggered_at).toLocaleString("ar-EG")} ·{" "}
                          {fmt(Number(a.last_triggered_price ?? 0))}
                        </span>
                      )}
                      {a.note && (
                        <span className="block text-[10px] text-muted-foreground">{a.note}</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="font-bold"
                          onClick={() => void updateAlert(a.id, { is_active: !a.is_active })}
                        >
                          {a.is_active ? "إيقاف" : "تنشيط"}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="font-bold"
                          onClick={() => void updateAlert(a.id, { repeat_alert: !a.repeat_alert })}
                        >
                          <Repeat className="size-3.5" /> {a.repeat_alert ? "مرة واحدة" : "تكرار"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`حذف تنبيه ${a.symbol}`}
                          className="text-muted-foreground hover:text-bear"
                          onClick={() => void removeAlert(a.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
