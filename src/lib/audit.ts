import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "grant_pro"
  | "revoke_pro"
  | "promote_admin"
  | "demote_admin"
  | "symbol_add"
  | "symbol_edit"
  | "symbol_toggle";

export const AUDIT_LABELS: Record<AuditAction, string> = {
  grant_pro: "منح PRO مجانًا",
  revoke_pro: "سحب PRO",
  promote_admin: "تعيين Admin",
  demote_admin: "إزالة Admin",
  symbol_add: "إضافة سهم",
  symbol_edit: "تعديل سهم",
  symbol_toggle: "تنشيط/إيقاف سهم",
};

export type AuditRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_label: string | null;
  details: unknown;
  created_at: string;
};

/** Fire-and-forget audit write. Never blocks or breaks the admin action. */
export async function logAdminAction(input: {
  action: AuditAction;
  targetType?: "user" | "symbol";
  targetId?: string | null;
  targetLabel?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("admin_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: input.action,
      target_type: input.targetType ?? "user",
      target_id: input.targetId ?? null,
      target_label: input.targetLabel ?? null,
      details: (input.details ?? {}) as never,
    });
  } catch {
    /* audit failures must not break admin work */
  }
}
