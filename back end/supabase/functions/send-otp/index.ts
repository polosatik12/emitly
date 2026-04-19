const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SMTP_HOST = Deno.env.get("SMTP_HOST")!;
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
const SMTP_USER = Deno.env.get("SMTP_USER")!;
const SMTP_PASS = Deno.env.get("SMTP_PASS")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function encodeBase64(str: string): string {
  return btoa(
    new TextEncoder()
      .encode(str)
      .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
  );
}

async function sendSmtp(to: string, subject: string, html: string) {
  const conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT });
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  async function read(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return n ? decoder.decode(buf.subarray(0, n)) : "";
  }

  async function write(data: string) {
    await conn.write(encoder.encode(data + "\r\n"));
  }

  async function command(cmd: string): Promise<string> {
    await write(cmd);
    return await read();
  }

  // Read greeting
  await read();

  await command(`EHLO emitly.ru`);

  // AUTH LOGIN
  await command("AUTH LOGIN");
  await command(encodeBase64(SMTP_USER));
  const authRes = await command(encodeBase64(SMTP_PASS));
  if (!authRes.startsWith("235")) {
    conn.close();
    throw new Error("SMTP Auth failed: " + authRes);
  }

  await command(`MAIL FROM:<${SMTP_USER}>`);
  await command(`RCPT TO:<${to}>`);
  await command("DATA");

  const subjectEncoded = `=?UTF-8?B?${encodeBase64(subject)}?=`;
  const boundary = "----=_Part_" + Date.now();

  const message = [
    `From: =?UTF-8?B?${encodeBase64("Emitly")}?= <${SMTP_USER}>`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodeBase64(html),
    ``,
    `--${boundary}--`,
    `.`,
  ].join("\r\n");

  const res = await command(message);
  await command("QUIT");
  conn.close();

  if (!res.startsWith("250")) {
    throw new Error("SMTP send failed: " + res);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email обязателен" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = generateCode();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Invalidate old codes
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("email", email.toLowerCase())
      .eq("used", false);

    // Insert new code
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({ email: email.toLowerCase(), code });

    if (insertError) {
      throw new Error("Не удалось сохранить код: " + insertError.message);
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:32px;">
  <h2 style="color:#1a1a1a;margin-bottom:8px;">
    <span style="color:#10B77F;">Emit</span>ly
  </h2>
  <p style="color:#555;font-size:15px;margin-bottom:24px;">
    Ваш код подтверждения:
  </p>
  <div style="background:#f4f4f5;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
    <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;">${code}</span>
  </div>
  <p style="color:#999;font-size:13px;">
    Код действителен 10 минут. Если вы не запрашивали код, проигнорируйте это письмо.
  </p>
</div>
</body>
</html>`;

    await sendSmtp(email, `${code} — код подтверждения Emitly`, html);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-otp error:", error);
    return new Response(JSON.stringify({ error: error.message || "Ошибка отправки кода" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
