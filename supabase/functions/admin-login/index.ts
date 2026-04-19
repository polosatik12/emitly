const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_LOGIN = Deno.env.get("ADMIN_PANEL_LOGIN") ?? "";
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PANEL_PASSWORD") ?? "";

// Simple constant-time string compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { login, password } = await req.json();

    if (typeof login !== "string" || typeof password !== "string" || !login || !password) {
      return new Response(JSON.stringify({ error: "Введите логин и пароль" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ADMIN_LOGIN || !ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Админ-доступ не сконфигурирован" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = safeEqual(login, ADMIN_LOGIN) && safeEqual(password, ADMIN_PASSWORD);
    if (!ok) {
      // Small delay to slow down brute force
      await new Promise((r) => setTimeout(r, 600));
      return new Response(JSON.stringify({ error: "Неверный логин или пароль" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Issue a short-lived token (2 hours). Stateless: hash(login|password|exp).
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
    const token = await sha256(`${ADMIN_LOGIN}|${ADMIN_PASSWORD}|${expiresAt}`);

    return new Response(JSON.stringify({ success: true, token, expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Ошибка" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
