import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-xl border border-primary/40 bg-panel/95 p-3 shadow-2xl backdrop-blur md:left-auto md:right-4 md:w-96">
      <Download className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">Add Nabd EGX Terminal</p>
        <p className="truncate text-xs text-muted-foreground">
          Install for full-screen access on your phone.
        </p>
      </div>
      <button
        onClick={async () => {
          await deferred?.prompt();
          setVisible(false);
        }}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
      >
        Install
      </button>
      <button
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
        className="shrink-0 text-muted-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
