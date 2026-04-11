import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(hash);
}

async function validateTelegramData(initData: string, botToken: string): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash")?.toLowerCase();
  if (!hash) return null;

  params.delete("hash");
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");

  const baseKey = encoder.encode("WebAppData");
  const secretKeyBuffer = await hmacSha256(baseKey, botToken);
  const computedHash = toHex(await hmacSha256(new Uint8Array(secretKeyBuffer), dataCheckString));

  if (computedHash !== hash) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || now - authDate > 60 * 60 * 24) return null;

  return Object.fromEntries(params.entries());
}

function isUserExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("already") && lower.includes("registered")) ||
    lower.includes("already exists")
  );
}

async function buildTelegramPassword(telegramId: string, serviceRoleKey: string): Promise<string> {
  const digest = await sha256Hex(`tg-auth:${telegramId}:${serviceRoleKey}`);
  return `Tg_${digest.slice(0, 40)}aA1!`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null);
    const initData = typeof body?.initData === "string" ? body.initData : "";

    if (!initData) {
      return new Response(JSON.stringify({ error: "initData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validated = await validateTelegramData(initData, botToken);
    if (!validated) {
      return new Response(JSON.stringify({ error: "Invalid Telegram initData" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userData: Record<string, unknown> = {};
    try {
      userData = JSON.parse(validated.user ?? "{}");
    } catch {
      userData = {};
    }

    const telegramId = String(userData.id ?? "").trim();
    if (!telegramId) {
      return new Response(JSON.stringify({ error: "Telegram user is missing in initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = String(userData.first_name ?? "").trim();
    const lastName = String(userData.last_name ?? "").trim();
    const username = String(userData.username ?? "").trim();
    const photoUrl = String(userData.photo_url ?? "").trim();

    const displayName = [firstName, lastName].filter(Boolean).join(" ") || username || `tg_${telegramId}`;
    const email = `tg_${telegramId}@telegram.local`;
    const password = await buildTelegramPassword(telegramId, serviceRoleKey);

    const signIn = await supabase.auth.signInWithPassword({ email, password });

    if (!signIn.error && signIn.data.session) {
      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: signIn.data.user.id,
            display_name: displayName,
            avatar_url: photoUrl || null,
          },
          { onConflict: "user_id" },
        );

      return new Response(
        JSON.stringify({
          session: signIn.data.session,
          user: signIn.data.user,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
      if (!isUserExistsError(createResult.error.message)) {
        throw createResult.error;
      }

      const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw listed.error;

      const existingUser = listed.data.users.find(
        (user) => (user.email ?? "").toLowerCase() === email.toLowerCase(),
      );

      if (!existingUser) throw createResult.error;

      const updateResult = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          display_name: displayName,
          telegram_id: telegramId,
          telegram_username: username || null,
          avatar_url: photoUrl || null,
        },
      });

      if (updateResult.error) throw updateResult.error;
    }

    const finalSignIn = await supabase.auth.signInWithPassword({ email, password });
    if (finalSignIn.error || !finalSignIn.data.session) {
      throw finalSignIn.error ?? new Error("Unable to create session after Telegram auth");
    }

    await supabase
      .from("profiles")
      .upsert(
        {
          user_id: finalSignIn.data.user.id,
          display_name: displayName,
          avatar_url: photoUrl || null,
        },
        { onConflict: "user_id" },
      );

    return new Response(
      JSON.stringify({
        session: finalSignIn.data.session,
        user: finalSignIn.data.user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Telegram auth error";
    console.error("telegram-auth error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
