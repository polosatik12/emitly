// Frontend polls this every ~2 seconds with { token }.
// Returns { status: "pending" } until the user pressed /start in the bot.
// On confirmed: provisions/finds the auth user and returns a fresh session.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(hash);
}

async function buildTelegramPassword(telegramId: string, serviceRoleKey: string): Promise<string> {
  const digest = await sha256Hex(`tg-auth:${telegramId}:${serviceRoleKey}`);
  return `Tg_${digest.slice(0, 40)}aA1!`;
}

function isUserExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("already") && lower.includes("registered")) ||
    lower.includes("already exists")
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row, error: selErr } = await supabase
      .from("telegram_login_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (selErr) throw selErr;
    if (!row) {
      return new Response(JSON.stringify({ status: "not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ status: "expired" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.status === "consumed") {
      return new Response(JSON.stringify({ status: "consumed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.status !== "confirmed") {
      return new Response(JSON.stringify({ status: "pending" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramId = String(row.telegram_user_id ?? "").trim();
    if (!telegramId) throw new Error("token confirmed without telegram_user_id");

    const firstName = (row.telegram_first_name ?? "").toString().trim();
    const lastName = (row.telegram_last_name ?? "").toString().trim();
    const username = (row.telegram_username ?? "").toString().trim();

    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") || username || `tg_${telegramId}`;
    const email = `tg_${telegramId}@telegram.local`;
    const password = await buildTelegramPassword(telegramId, serviceRoleKey);

    let signIn = await supabase.auth.signInWithPassword({ email, password });

    if (signIn.error || !signIn.data.session) {
      const created = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          telegram_id: telegramId,
          telegram_username: username || null,
        },
      });

      if (created.error) {
        if (!isUserExistsError(created.error.message)) throw created.error;

        // user already exists with different password — reset it
        const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listed.error) throw listed.error;
        const existing = listed.data.users.find(
          (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
        );
        if (!existing) throw created.error;

        const upd = await supabase.auth.admin.updateUserById(existing.id, { password });
        if (upd.error) throw upd.error;
      }

      signIn = await supabase.auth.signInWithPassword({ email, password });
      if (signIn.error || !signIn.data.session) {
        throw signIn.error ?? new Error("Unable to create session after Telegram login");
      }
    }

    await supabase.from("profiles").upsert(
      {
        user_id: signIn.data.user.id,
        display_name: displayName,
        telegram_chat_id: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
      },
      { onConflict: "user_id" },
    );

    await supabase
      .from("telegram_login_tokens")
      .update({ status: "consumed", user_id: signIn.data.user.id })
      .eq("token", token);

    return new Response(
      JSON.stringify({
        status: "confirmed",
        session: signIn.data.session,
        user: signIn.data.user,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("tg-login-poll error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
