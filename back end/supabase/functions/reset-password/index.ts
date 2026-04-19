const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email, код и новый пароль обязательны" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Пароль должен быть не менее 6 символов" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailLower = String(email).toLowerCase();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Verify OTP code (must exist, unused, not expired)
    const { data: otpRecord, error: otpErr } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", emailLower)
      .eq("code", String(code))
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpErr || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Неверный или истёкший код" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Find user by email via Admin API (paginate)
    let foundUser: any = null;
    let page = 1;
    while (page <= 20) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      const u = data.users.find((x: any) => (x.email || "").toLowerCase() === emailLower);
      if (u) { foundUser = u; break; }
      if (data.users.length < 1000) break;
      page++;
    }

    if (!foundUser) {
      return new Response(
        JSON.stringify({ error: "Пользователь с таким email не найден" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Update password
    const { error: updErr } = await supabase.auth.admin.updateUserById(foundUser.id, {
      password: newPassword,
    });
    if (updErr) throw new Error(updErr.message);

    // 4. Burn the OTP code
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("reset-password error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ошибка смены пароля" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
