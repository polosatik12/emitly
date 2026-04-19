// Long-polls the NEW Telegram bot's getUpdates, looks for "/start <token>" messages,
// marks the corresponding telegram_login_tokens row as confirmed, and replies
// "Вы успешно авторизованы" to the user.
//
// Schedule via pg_cron every minute. Each invocation runs up to ~55s.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

async function tgCall(botToken: string, method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const start = Date.now();

  try {
    const botToken = Deno.env.get("NEW_TELEGRAM_BOT_TOKEN");
    if (!botToken) throw new Error("NEW_TELEGRAM_BOT_TOKEN is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: state, error: stErr } = await supabase
      .from("telegram_login_bot_state")
      .select("update_offset")
      .eq("id", 1)
      .single();
    if (stErr) throw stErr;

    let offset = state.update_offset as number;
    let processed = 0;

    while (true) {
      const elapsed = Date.now() - start;
      const remaining = MAX_RUNTIME_MS - elapsed;
      if (remaining < MIN_REMAINING_MS) break;
      const timeout = Math.min(50, Math.floor(remaining / 1000) - 5);
      if (timeout < 1) break;

      const updates = await tgCall(botToken, "getUpdates", {
        offset,
        timeout,
        allowed_updates: ["message"],
      });

      if (!updates?.ok) {
        console.error("getUpdates failed:", JSON.stringify(updates));
        break;
      }

      const list: any[] = updates.result ?? [];
      if (list.length === 0) continue;

      for (const upd of list) {
        const msg = upd.message;
        if (!msg) continue;
        const text = (msg.text ?? "").trim();
        const chatId = msg.chat?.id;
        const from = msg.from ?? {};

        // Match "/start <token>"
        const match = text.match(/^\/start(?:@\w+)?\s+(\S+)/);
        if (!match) {
          // unrelated message — optionally reply with hint
          if (text === "/start" && chatId) {
            await tgCall(botToken, "sendMessage", {
              chat_id: chatId,
              text: "Привет! Чтобы войти на сайт, нажми кнопку «Войти через Telegram» на emitly и затем вернись в этот бот.",
            });
          }
          continue;
        }

        const token = match[1];

        const { data: row, error: rowErr } = await supabase
          .from("telegram_login_tokens")
          .select("token, status, expires_at")
          .eq("token", token)
          .maybeSingle();

        if (rowErr) {
          console.error("token lookup failed:", rowErr.message);
          continue;
        }

        if (!row) {
          if (chatId) {
            await tgCall(botToken, "sendMessage", {
              chat_id: chatId,
              text: "❌ Ссылка не найдена. Запроси новый вход на сайте.",
            });
          }
          continue;
        }

        if (new Date(row.expires_at).getTime() < Date.now()) {
          if (chatId) {
            await tgCall(botToken, "sendMessage", {
              chat_id: chatId,
              text: "⌛️ Ссылка истекла. Запроси новый вход на сайте.",
            });
          }
          continue;
        }

        if (row.status !== "pending") {
          if (chatId) {
            await tgCall(botToken, "sendMessage", {
              chat_id: chatId,
              text: "✅ Вы уже авторизованы. Можно вернуться на сайт.",
            });
          }
          continue;
        }

        const { error: updErr } = await supabase
          .from("telegram_login_tokens")
          .update({
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
            telegram_user_id: from.id ?? null,
            telegram_chat_id: chatId ?? null,
            telegram_username: from.username ?? null,
            telegram_first_name: from.first_name ?? null,
            telegram_last_name: from.last_name ?? null,
          })
          .eq("token", token)
          .eq("status", "pending");

        if (updErr) {
          console.error("token update failed:", updErr.message);
          continue;
        }

        if (chatId) {
          await tgCall(botToken, "sendMessage", {
            chat_id: chatId,
            text: "✅ Вы успешно авторизованы! Возвращайтесь на сайт — вход выполнится автоматически.",
          });
        }

        processed++;
      }

      const lastId = Math.max(...list.map((u: any) => u.update_id));
      offset = lastId + 1;
      const { error: offErr } = await supabase
        .from("telegram_login_bot_state")
        .update({ update_offset: offset, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (offErr) {
        console.error("offset update failed:", offErr.message);
        break;
      }
    }

    return new Response(JSON.stringify({ ok: true, processed, offset }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("tg-login-bot-poll error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
