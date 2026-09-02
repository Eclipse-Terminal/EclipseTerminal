import {
  Bell,
  BellOff,
  BellRing,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { fmt } from "@/lib/egx-data";
import { usePriceAlerts } from "@/lib/price-alerts";

type PermissionInfo = {
  label: string;
  detail: string;
  tone: string;
  icon: typeof ShieldCheck;
};

function permissionInfo(permission: string): PermissionInfo {
  switch (permission) {
    case "granted":
      return {
        label: "إشعارات المتصفح مسموحة",
        detail: "سيصلك إشعار على النظام حتى لو كان التاب في الخلفية، بشرط أن يكون المتصفح مفتوحًا.",
        tone: "border-bull/40 bg-bull/10 text-bull",
        icon: ShieldCheck,
      };
    case "denied":
      return {
        label: "إشعارات المتصفح محظورة",
        detail:
          "المتصفح يرفض الإشعارات لهذا الموقع، ولا يمكن للتطبيق طلب الإذن مرة أخرى. افتح قائمة القفل/الإعدادات بجوار عنوان الموقع وحوّل الإشعارات إلى «سماح»، ثم أعد تحميل الصفحة. حتى ذلك الحين ستعمل التنبيهات داخل التطبيق فقط.",
        tone: "border-bear/40 bg-bear/10 text-bear",
        icon: ShieldAlert,
      };
    case "unsupported":
      return {
        label: "المتصفح لا يدعم الإشعارات",
        detail:
          "هذا المتصفح أو وضع التصفح لا يوفر واجهة الإشعارات، لذا نعتمد على تنبيهات داخل التطبيق.",
        tone: "border-border bg-secondary/40 text-muted-foreground",
        icon: BellOff,
      };
    default:
      return {
        label: "لم يتم طلب الإذن بعد",
        detail:
          "اضغط «تشغيل إشعارات المتصفح» ليطلب المتصفح إذنك مرة واحدة. الرفض يمكن تعديله لاحقًا من إعدادات الموقع.",
        tone: "border-accent/40 bg-accent/10 text-accent",
        icon: BellRing,
      };
  }
}

export function NotificationSettingsDialog() {
  const { alerts, notifyPermission, requestNotifications, refreshPermission, updateAlert } =
    usePriceAlerts();
  const [checking, setChecking] = useState(false);
  const info = permissionInfo(notifyPermission);
  const Icon = info.icon;
  const browserUsable = notifyPermission === "granted";

  function handleRefresh() {
    setChecking(true);
    const current = refreshPermission();
    setTimeout(() => setChecking(false), 400);
    if (current === "granted") toast.success("تم التحقق: إشعارات المتصفح مفعّلة الآن ✅");
    else if (current === "denied")
      toast.error("الإشعارات ما زالت محظورة — فعّلها من إعدادات الموقع ثم أعد التحقق.");
    else if (current === "unsupported") toast.error("هذا المتصفح لا يدعم الإشعارات.");
    else toast("لم يُطلب الإذن بعد — اضغط «تشغيل إشعارات المتصفح».");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="font-bold">
          <Settings2 className="size-3.5" /> إعدادات الإشعارات
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2 text-base font-black">
            <Bell className="size-4 text-primary" /> إعدادات الإشعارات
          </DialogTitle>
          <DialogDescription className="text-xs">
            تحكّم في طريقة وصول تنبيهات الأسعار: تنبيه داخل التطبيق، أو إشعار من المتصفح، أو الاثنين
            — لكل قاعدة على حدة.
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-xl border p-3 ${info.tone}`}>
          <p className="flex items-center gap-2 text-xs font-black">
            <Icon className="size-4" /> {info.label}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/80">{info.detail}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {notifyPermission === "default" && (
              <Button size="sm" className="font-bold" onClick={() => void requestNotifications()}>
                <BellRing className="size-3.5" /> تشغيل إشعارات المتصفح
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="font-bold"
              onClick={handleRefresh}
              disabled={checking}
            >
              <RefreshCw className={`size-3.5 ${checking ? "animate-spin" : ""}`} /> تحديث حالة إذن
              المتصفح
            </Button>
          </div>
          {notifyPermission === "denied" && (
            <ol className="mt-2.5 list-decimal space-y-1 pr-4 text-[11px] leading-relaxed text-foreground/80">
              <li>اضغط على أيقونة القفل 🔒 بجوار عنوان الموقع في شريط المتصفح.</li>
              <li>افتح «إعدادات الموقع» / Site settings ثم بند «الإشعارات» / Notifications.</li>
              <li>غيّر القيمة إلى «سماح» (Allow).</li>
              <li>ارجع هنا واضغط «تحديث حالة إذن المتصفح» — أو أعد تحميل الصفحة.</li>
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-border bg-panel/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <p className="flex items-center gap-2 font-bold text-foreground">
            <MonitorSmartphone className="size-3.5 text-primary" /> ما الفرق؟
          </p>
          <p className="mt-1">
            <span className="font-bold text-foreground">داخل التطبيق:</span> رسالة منبثقة داخل
            التيرمينال — تظهر فقط عندما تكون الصفحة مفتوحة، ولا تحتاج أي إذن.
          </p>
          <p>
            <span className="font-bold text-foreground">المتصفح:</span> إشعار على مستوى النظام —
            يحتاج إذنًا صريحًا ويعمل أيضًا وأنت في تاب آخر.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black">القواعد ({alerts.length})</p>
          {alerts.length === 0 ? (
            <p className="rounded-xl border border-border bg-secondary/30 p-3 text-[11px] text-muted-foreground">
              لا قواعد بعد — أضف قاعدة تنبيه أولًا ثم اضبط قنوات الإشعار لها من هنا.
            </p>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-secondary/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black">
                    <span className="text-primary">{a.symbol}</span>{" "}
                    <span className="text-muted-foreground">
                      {a.kind === "target" ? "هدف" : "وقف"} @ {fmt(Number(a.threshold))} EGP
                    </span>
                  </p>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {a.is_active ? "نشط" : "موقوف"}
                  </span>
                </div>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-2.5 py-2">
                    <span className="text-[11px] font-bold">تنبيه داخل التطبيق</span>
                    <Switch
                      checked={a.notify_in_app !== false}
                      aria-label={`تنبيه داخل التطبيق لـ ${a.symbol}`}
                      onCheckedChange={(v) => void updateAlert(a.id, { notify_in_app: v })}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-2.5 py-2">
                    <span className="text-[11px] font-bold">
                      إشعار المتصفح
                      {!browserUsable && (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          يحتاج إذن المتصفح لكي يعمل
                        </span>
                      )}
                    </span>
                    <Switch
                      checked={a.notify_browser !== false}
                      aria-label={`إشعار المتصفح لـ ${a.symbol}`}
                      onCheckedChange={(v) => void updateAlert(a.id, { notify_browser: v })}
                    />
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
