import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseProxy";

export interface NewsItem {
  id: string;
  ticker: string;
  company_name: string;
  companyName: string;
  sector: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  category: string;
  date: string;
  fullDate: string;
  title: string;
  bodyText: string;
  bullPercent: number;
  bearPercent: number;
  comments: number;
  commentsList: { name: string; date: string; text: string; likes: number }[];
  sourceUrl?: string | null;
  source_slug?: string | null;
  /** коды сработавших категорий триггеров: peace_deal, cb_rate, macro, reports */
  triggerCategories: string[];
}

function mapRow(row: any, agg?: { long: number; short: number }): NewsItem {
  const total = agg ? agg.long + agg.short : 0;
  const bullPercent = total > 0 ? Math.round((agg!.long / total) * 100) : 50;
  const bearPercent = total > 0 ? 100 - bullPercent : 50;
  return {
    id: row.id,
    ticker: row.ticker,
    company_name: row.company_name,
    companyName: row.company_name,
    sector: row.sector,
    price: Number(row.price),
    priceChange: Number(row.price_change),
    priceChangePercent: Number(row.price_change_percent),
    category: row.category,
    date: row.date,
    fullDate: row.full_date,
    title: row.title,
    bodyText: row.body_text,
    bullPercent,
    bearPercent,
    comments: 0,
    commentsList: [],
    sourceUrl: row.source_url ?? null,
    source_slug: row.source_slug ?? null,
    triggerCategories: Array.isArray(row.trigger_categories) ? row.trigger_categories : [],
  };
}

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      const rows = data || [];
      const ids = rows.map((r: any) => r.id);

      // Батч-агрегация голосов одним запросом — чтобы карточки сразу
      // показывали реальные проценты Long/Short, а не дефолтные 50/50.
      const aggMap = new Map<string, { long: number; short: number }>();
      if (ids.length > 0) {
        const { data: votes } = await supabase
          .from("news_votes")
          .select("news_id, vote")
          .in("news_id", ids);
        (votes || []).forEach((v: any) => {
          const cur = aggMap.get(v.news_id) || { long: 0, short: 0 };
          if (v.vote === "long") cur.long++;
          else cur.short++;
          aggMap.set(v.news_id, cur);
        });
      }

      if (mounted) {
        setNews(rows.map((r: any) => mapRow(r, aggMap.get(r.id))));
        setLoading(false);
      }
    };

    load();

    // Realtime: сразу добавляем новую новость из парсера в начало ленты.
    // Уникальное имя канала на каждый mount — иначе при StrictMode/HMR падаем
    // с "cannot add postgres_changes callbacks ... after subscribe()".
    const channel = supabase.channel(`news-live-${Math.random().toString(36).slice(2)}`);
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news" },
        (payload) => {
          const row = payload.new as any;
          if (!row?.id) return;
          setNews((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev;
            return [mapRow(row), ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "news" },
        (payload) => {
          const row = payload.new as any;
          if (!row?.id) return;
          setNews((prev) =>
            prev.map((n) => (n.id === row.id ? { ...mapRow(row), bullPercent: n.bullPercent, bearPercent: n.bearPercent } : n)),
          );
        },
      )
      .subscribe();

    // Фоновый refetch каждые 60с как fallback на случай пропуска Realtime-сообщения.
    const poll = setInterval(load, 60_000);

    // Локальная синхронизация: когда пользователь голосует в drawer — обновляем
    // соответствующую карточку в ленте, чтобы не ждать следующего poll.
    const onVoteChanged = (e: Event) => {
      const { newsId, long, short } = (e as CustomEvent).detail || {};
      if (!newsId) return;
      const total = long + short;
      const bullPercent = total > 0 ? Math.round((long / total) * 100) : 50;
      const bearPercent = total > 0 ? 100 - bullPercent : 50;
      setNews((prev) =>
        prev.map((n) => (n.id === newsId ? { ...n, bullPercent, bearPercent } : n)),
      );
    };
    window.addEventListener("news-vote-changed", onVoteChanged);

    return () => {
      mounted = false;
      clearInterval(poll);
      window.removeEventListener("news-vote-changed", onVoteChanged);
      supabase.removeChannel(channel);
    };
  }, []);

  return { news, loading };
}
