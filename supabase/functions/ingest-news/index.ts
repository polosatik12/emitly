// Edge function: ingest-news
// Принимает новости от внешнего парсера. Авторизация через Bearer token.
// Поддерживает как один объект, так и массив объектов.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingNews {
  title: string;
  description?: string;
  ticker: string;
  emitter?: string;
  company_name?: string;
  categories?: string[];
  category?: string;
  published_at?: string;
  source_url?: string;
  body_text?: string;
  sector?: string;
}

function validateItem(item: any): { ok: true; data: IncomingNews } | { ok: false; error: string } {
  if (!item || typeof item !== "object") return { ok: false, error: "item must be an object" };
  if (typeof item.title !== "string" || !item.title.trim()) return { ok: false, error: "title is required" };
  if (typeof item.ticker !== "string" || !item.ticker.trim()) return { ok: false, error: "ticker is required" };
  return { ok: true, data: item as IncomingNews };
}

function formatDate(iso?: string): { date: string; full_date: string; published_at: string | null } {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return { date: shortDate(now), full_date: fullDate(now), published_at: null };
  }
  return { date: shortDate(d), full_date: fullDate(d), published_at: d.toISOString() };
}

function shortDate(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function fullDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}, ${shortDate(d)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: Bearer token
  const expectedToken = Deno.env.get("NEWS_INGEST_TOKEN");
  if (!expectedToken) {
    return new Response(JSON.stringify({ error: "Server misconfigured: NEWS_INGEST_TOKEN missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const items: any[] = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0) {
    return new Response(JSON.stringify({ error: "Empty payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const results = { inserted: 0, skipped: 0, errors: [] as Array<{ index: number; error: string }> };

  for (let i = 0; i < items.length; i++) {
    const v = validateItem(items[i]);
    if (!v.ok) {
      results.errors.push({ index: i, error: v.error });
      continue;
    }
    const it = v.data;
    const { date, full_date, published_at } = formatDate(it.published_at);
    const ticker = it.ticker.trim().toUpperCase();
    const company_name = (it.emitter || it.company_name || ticker).trim();
    const categories = Array.isArray(it.categories) ? it.categories.filter((c) => typeof c === "string") : [];
    const category = it.category || categories[0] || "Событие";

    // Дедупликация по source_url (если задан)
    if (it.source_url) {
      const { data: existing } = await supabase
        .from("news")
        .select("id")
        .eq("source_url", it.source_url)
        .maybeSingle();
      if (existing) {
        results.skipped++;
        continue;
      }
    }

    const row = {
      title: it.title.trim(),
      description: it.description ?? null,
      body_text: it.body_text ?? it.description ?? "",
      ticker,
      company_name,
      categories,
      category,
      sector: it.sector ?? "",
      source_url: it.source_url ?? null,
      published_at,
      date,
      full_date,
    };

    const { error } = await supabase.from("news").insert(row);
    if (error) {
      results.errors.push({ index: i, error: error.message });
    } else {
      results.inserted++;
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
