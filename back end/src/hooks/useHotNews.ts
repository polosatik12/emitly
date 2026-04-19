import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseProxy";
import type { NewsItem } from "@/hooks/useNews";

const MIN_VOTES = 2;
const HOURS_WINDOW = 24;
const TOP_LIMIT = 3;
const POLL_INTERVAL = 30_000; // 30s

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_URL_DIRECT = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = "https://emitly.ru/api";

function getBaseUrl(): string {
  if (typeof window === "undefined") return SUPABASE_URL_DIRECT;
  const host = window.location.hostname;
  const isProd = host === "emitly.ru" || host.endsWith(".emitly.ru");
  return isProd ? PROXY_URL : SUPABASE_URL_DIRECT;
}

export interface HotNewsItem {
  news: NewsItem;
  long: number;
  short: number;
  total: number;
}

/**
 * Прямой fetch минуя supabase-js, чтобы гарантированно отключить кэш на Nginx-прокси (emitly.ru).
 * Каждый запрос содержит cache-buster `_ts` и заголовок `Cache-Control: no-cache`.
 */
async function fetchNoCache(path: string): Promise<any> {
  const base = getBaseUrl();
  // NB: cache-buster НЕ через query (PostgREST трактует неизвестные параметры как фильтры по колонкам).
  // Обходим кэш Nginx через заголовки + уникальный Accept-параметр.
  const url = `${base}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Cache-Control": "no-cache, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Cache-Bust": String(Date.now()),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[useHotNews] fetch failed:", res.status, await res.text());
    return null;
  }
  return res.json();
}

/**
 * Автономный хук: сам загружает голоса и новости, не зависит от allNews.
 * Обновляется через Realtime + polling каждые 30с.
 */
export function useHotNews(_allNews?: NewsItem[]) {
  const [hot, setHot] = useState<HotNewsItem[]>([]);

  useEffect(() => {
    let mounted = true;

    const recompute = async () => {
      const since = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000).toISOString();
      const votes = await fetchNoCache(
        `news_votes?select=news_id,vote,created_at&created_at=gte.${encodeURIComponent(since)}`,
      );

      console.log("[useHotNews] votes fetched:", { count: votes?.length, since });

      if (!mounted || !votes?.length) {
        if (mounted) setHot([]);
        return;
      }

      // Агрегируем голоса
      const agg = new Map<string, { long: number; short: number }>();
      votes.forEach((v: { news_id: string; vote: string }) => {
        const cur = agg.get(v.news_id) || { long: 0, short: 0 };
        if (v.vote === "long") cur.long++;
        else if (v.vote === "short") cur.short++;
        agg.set(v.news_id, cur);
      });

      // Фильтруем по порогу
      const candidates: { newsId: string; long: number; short: number; total: number }[] = [];
      agg.forEach((counts, newsId) => {
        const total = counts.long + counts.short;
        if (total < MIN_VOTES) return;
        if (counts.long <= counts.short) return;
        candidates.push({ newsId, long: counts.long, short: counts.short, total });
      });

      console.log("[useHotNews] candidates after threshold:", candidates);

      if (!candidates.length) {
        if (mounted) setHot([]);
        return;
      }

      // Загружаем сами новости по ID (тоже без кэша)
      const ids = candidates.map((c) => c.newsId);
      const inList = `(${ids.map((i) => `"${i}"`).join(",")})`;
      const newsRows = await fetchNoCache(`news?select=*&id=in.${encodeURIComponent(inList)}`);

      console.log("[useHotNews] news fetched:", { count: newsRows?.length, ids });

      if (!mounted) return;

      const newsMap = new Map<string, NewsItem>(
        (newsRows || []).map((r: any): [string, NewsItem] => [
          r.id,
          {
            id: r.id,
            ticker: r.ticker,
            company_name: r.company_name,
            companyName: r.company_name,
            sector: r.sector,
            price: Number(r.price),
            priceChange: Number(r.price_change),
            priceChangePercent: Number(r.price_change_percent),
            category: r.category,
            date: r.date,
            fullDate: r.full_date,
            title: r.title,
            bodyText: r.body_text,
            bullPercent: 50,
            bearPercent: 50,
            comments: 0,
            commentsList: [],
            sourceUrl: r.source_url ?? null,
          } as NewsItem,
        ]),
      );

      const hotList: HotNewsItem[] = [];
      candidates.forEach((c) => {
        const news = newsMap.get(c.newsId);
        if (!news) return;
        const total = c.long + c.short;
        news.bullPercent = Math.round((c.long / total) * 100);
        news.bearPercent = 100 - news.bullPercent;
        hotList.push({ news, long: c.long, short: c.short, total: c.total });
      });

      hotList.sort((a, b) => {
        if (b.long !== a.long) return b.long - a.long;
        return b.long / b.total - a.long / a.total;
      });

      if (mounted) setHot(hotList.slice(0, TOP_LIMIT));
    };

    // Первичный расчёт
    recompute();

    // Polling
    const interval = setInterval(recompute, POLL_INTERVAL);

    // Realtime подписка
    const channel = supabase
      .channel("hot-news-votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_votes" },
        () => {
          setTimeout(recompute, 500);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return hot;
}
