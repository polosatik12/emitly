const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const email = claimsData.claims.email;

    // Parse body
    const { planId, period, amount, description } = await req.json();

    if (!planId || !period || !amount || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SHOP_ID = Deno.env.get("YOOKASSA_SHOP_ID");
    const SECRET_KEY = Deno.env.get("YOOKASSA_SECRET_KEY");

    if (!SHOP_ID || !SECRET_KEY) {
      return new Response(JSON.stringify({ error: "YooKassa not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotenceKey = crypto.randomUUID();

    const paymentBody = {
      amount: {
        value: String(amount) + ".00",
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: `${req.headers.get("origin") || "https://sweet-front-redo.lovable.app"}/service-catalog?payment=success`,
      },
      capture: true,
      description,
      metadata: {
        user_id: userId,
        plan_id: planId,
        period,
      },
      receipt: email
        ? {
            customer: { email },
            items: [
              {
                description,
                quantity: "1",
                amount: { value: String(amount) + ".00", currency: "RUB" },
                vat_code: 1,
                payment_subject: "service",
                payment_mode: "full_payment",
              },
            ],
          }
        : undefined,
    };

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${SHOP_ID}:${SECRET_KEY}`),
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("YooKassa error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Payment creation failed", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        confirmation_url: data.confirmation?.confirmation_url,
        payment_id: data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
