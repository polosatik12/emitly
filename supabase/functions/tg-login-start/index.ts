// Generates a one-time login token and returns a deep-link to the new Telegram bot.
// Frontend opens t.me/<bot>?start=<token>, then polls tg-login-poll for the session.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function makeToken(): string {
  // ~22 chars, URL-safe; Telegram /start payload limit is 64
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedBotUsername: string | null = null;

async function fetchBotUsername(botToken: string): Promise<string> {
  if (cachedBotUsername) return cachedBotUsername;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const data = await res.json();
  if (!data?.ok || !data?.result?.username) {
    throw new Error(`getMe failed: ${JSON.stringify(data)}`);
  }
  cachedBotUsername = data.result.username as string;
  return cachedBotUsername;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("NEW_TELEGRAM_BOT_TOKEN");
    if (!botToken) throw new Error("NEW_TELEGRAM_BOT_TOKEN is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase env not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const username = await fetchBotUsername(botToken);
    const token = makeToken();

    const { error } = await supabase.from("telegram_login_tokens").insert({
      token,
      status: "pending",
    });
    if (error) throw error;

    return new Response(
      JSON.stringify({
        token,
        bot_username: username,
        deep_link: `https://t.me/${username}?start=${token}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("tg-login-start error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
