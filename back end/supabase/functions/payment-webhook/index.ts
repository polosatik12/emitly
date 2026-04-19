import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const event = body.event;
    const paymentObject = body.object;

    if (!event || !paymentObject) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (event === "payment.succeeded") {
      const paymentId = paymentObject.id;
      const metadata = paymentObject.metadata || {};
      const userId = metadata.user_id;
      const planId = metadata.plan_id;
      const period = metadata.period;
      const amount = parseInt(paymentObject.amount?.value || "0", 10);

      if (!userId || !planId) {
        console.error("Missing metadata:", metadata);
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date();
      const expiresAt = new Date(now);
      if (period === "year") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          period: period || "month",
          status: "active",
          payment_id: paymentId,
          amount,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create subscription" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Subscription activated: user=${userId}, plan=${planId}, expires=${expiresAt.toISOString()}`);
    }

    if (event === "payment.canceled") {
      const paymentId = paymentObject.id;
      console.log(`Payment canceled: ${paymentId}`);
    }

    if (event === "refund.succeeded") {
      const paymentId = paymentObject.payment_id;
      console.log(`Refund for payment: ${paymentId}`);

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("payment_id", paymentId);

      if (updateError) {
        console.error("Update error:", updateError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
