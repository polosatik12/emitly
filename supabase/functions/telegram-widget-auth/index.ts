import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: Uint8Array, value: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
}

async function sha256(data: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", encoder.encode(data));
}

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(hash);
}

// Validate Telegram Login Widget data
// https://core.telegram.org/widgets/login#checking-authorization
async function validateWidgetData(
  data: Record<string, string>,
  botToken: string,
): Promise<boolean> {
  const hash = data.hash;
  if (!hash) return false;

  // Build data-check-string: sorted key=value excluding hash
  const checkArr = Object.entries(data)
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  const dataCheckString = checkArr.join("\n");

  // secret_key = SHA256(bot_token)
  const secretKey = new Uint8Array(await sha256(botToken));
  const computedHash = toHex(await hmacSha256(secretKey, dataCheckString));

  if (computedHash.toLowerCase() !== hash.toLowerCase()) return false;

  // Check auth_date is not too old (24 hours)
  const authDate = Number(data.auth_date ?? 0);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || now - authDate > 86400) return false;

  return true;
}

async function buildPassword(telegramId: string, serviceRoleKey: string): Promise<string> {
  const digest = await sha256Hex(`tg-auth:${telegramId}:${serviceRoleKey}`);
  return `Tg_${digest.slice(0, 40)}aA1!`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET → return bot username for widget rendering
  if (req.method === "GET") {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const json = await res.json();
      if (!json.ok) throw new Error("getMe failed");
      return new Response(
        JSON.stringify({ bot_username: json.result.username, bot_id: json.result.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to get bot info" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // POST → validate widget data and create session
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null);
    if (!body || !body.id || !body.hash) {
      return new Response(JSON.stringify({ error: "Invalid widget data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert all values to strings for validation
    const widgetData: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      widgetData[key] = String(value);
    }

    const isValid = await validateWidgetData(widgetData, botToken);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid Telegram auth data" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const telegramId = String(body.id);
    const firstName = String(body.first_name ?? "").trim();
    const lastName = String(body.last_name ?? "").trim();
    const username = String(body.username ?? "").trim();
    const photoUrl = String(body.photo_url ?? "").trim();

    const displayName = [firstName, lastName].filter(Boolean).join(" ") || username || `tg_${telegramId}`;
    const email = `tg_${telegramId}@telegram.local`;
    const password = await buildPassword(telegramId, serviceRoleKey);

    // Try sign in first
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (!signIn.error && signIn.data.session) {
      await supabase.from("profiles").upsert(
        { user_id: signIn.data.user.id, display_name: displayName, avatar_url: photoUrl || null },
        { onConflict: "user_id" },
      );
      return new Response(JSON.stringify({ session: signIn.data.session, user: signIn.data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user
    const createResult = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        telegram_id: telegramId,
        telegram_username: username || null,
        avatar_url: photoUrl || null,
      },
    });

    if (createResult.error) {
      const lower = createResult.error.message.toLowerCase();
      const isExisting = lower.includes("already") || lower.includes("exists");
      if (!isExisting) throw createResult.error;

      // Update password for existing user
      const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw listed.error;
      const existingUser = listed.data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
      if (!existingUser) throw createResult.error;

      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          display_name: displayName,
          telegram_id: telegramId,
          avatar_url: photoUrl || null,
        },
      });
    }

    const finalSignIn = await supabase.auth.signInWithPassword({ email, password });
    if (finalSignIn.error || !finalSignIn.data.session) {
      throw finalSignIn.error ?? new Error("Unable to create session");
    }

    await supabase.from("profiles").upsert(
      { user_id: finalSignIn.data.user.id, display_name: displayName, avatar_url: photoUrl || null },
      { onConflict: "user_id" },
    );

    return new Response(JSON.stringify({ session: finalSignIn.data.session, user: finalSignIn.data.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("telegram-widget-auth error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
