import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

export type ChatThread = {
  id: string;
  title: string;
  updated_at: string;
};

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export async function listThreads(): Promise<ChatThread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[chat] listThreads", error);
    return [];
  }
  return data ?? [];
}

export async function createThread(title: string): Promise<ChatThread | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, title })
    .select("id, title, updated_at")
    .single();
  if (error) {
    console.error("[chat] createThread", error);
    return null;
  }
  return data;
}

export async function renameThread(threadId: string, title: string) {
  const { error } = await supabase.from("chat_threads").update({ title }).eq("id", threadId);
  if (error) console.error("[chat] renameThread", error);
}

export async function deleteThread(threadId: string) {
  const { error } = await supabase.from("chat_threads").delete().eq("id", threadId);
  if (error) console.error("[chat] deleteThread", error);
}

export async function loadMessages(threadId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, parts, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[chat] loadMessages", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: (Array.isArray(row.parts) && row.parts.length
      ? row.parts
      : [{ type: "text", text: row.content }]) as UIMessage["parts"],
  }));
}

export async function saveMessage(threadId: string, message: UIMessage) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  const { error } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    user_id: userId,
    role: message.role,
    client_message_id: message.id,
    parts: message.parts as unknown as never,
    content: textOf(message),
  });
  if (error) console.error("[chat] saveMessage", error);
  else
    await supabase
      .from("chat_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);
}

export function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean || "محادثة جديدة";
}
