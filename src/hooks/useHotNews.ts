import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseProxy";
import type { NewsItem } from "@/hooks/useNews";

const MIN_VOTES = 8;
const HOURS_WINDOW = 24;
const TOP_LIMIT = 3;

export interface HotNewsItem {
  news: NewsItem;
  long: number;
  short: number;
  total: number;
}

/**
 * Топ-N "горячих" новостей за последние 24ч,
 * где минимум MIN_VOTES голосов и большинство — long.
 * Авто-обновление через Realtime (news_votes) с дебаунсом.
 */
export function useHotNews(allNews: NewsItem[]) {
  const [hot, setHot] = useState<HotNewsItem[]>([]);
  const newsRef = useRef(allNews);
  newsRef.current = allNews;

  useEffect(() => {
    let mounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const recompute = async () => {
      const current = newsRef.current;
      if (!current.length) {
        if (mounted) setHot([]);
        return;
      }
      const since = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("news_votes")
        .select("news_id, vote, created_at")
        .gte("created_at", since);

      if (!mounted) return;

      const agg = new Map<string, { long: number; short: number }>();
      (data || []).forEach((v: { news_id: string; vote: string }) => {
        const cur = agg.get(v.news_id) || { long: 0, short: 0 };
        if (v.vote === "long") cur.long++;
        else if (v.vote === "short") cur.short++;
        agg.set(v.news_id, cur);
      });

      const newsMap = new Map(current.map((n) => [n.id, n]));
      const hotList: HotNewsItem[] = [];
      agg.forEach((counts, newsId) => {
        const total = counts.long + counts.short;
        if (total < MIN_VOTES) return;
        if (counts.long <= counts.short) return;
        const news = newsMap.get(newsId);
        if (!news) return;
        hotList.push({ news, long: counts.long, short: counts.short, total });
      });

      hotList.sort((a, b) => {
        if (b.long !== a.long) return b.long - a.long;
        return b.long / b.total - a.long / a.total;
      });

      if (mounted) setHot(hotList.slice(0, TOP_LIMIT));
    };

    const schedule = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(recompute, 500);
    };

    // Первичный расчёт
    recompute();

    // Realtime подписка на голоса
    const channel = supabase
      .channel("hot-news-votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_votes" },
        () => schedule()
      )
      .subscribe();

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Пересчёт при изменении набора новостей (без пересоздания канала)
  useEffect(() => {
    if (!allNews.length) return;
    const t = setTimeout(async () => {
      const since = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("news_votes")
        .select("news_id, vote, created_at")
        .gte("created_at", since);

      const agg = new Map<string, { long: number; short: number }>();
      (data || []).forEach((v: { news_id: string; vote: string }) => {
        const cur = agg.get(v.news_id) || { long: 0, short: 0 };
        if (v.vote === "long") cur.long++;
        else if (v.vote === "short") cur.short++;
        agg.set(v.news_id, cur);
      });

      const newsMap = new Map(allNews.map((n) => [n.id, n]));
      const hotList: HotNewsItem[] = [];
      agg.forEach((counts, newsId) => {
        const total = counts.long + counts.short;
        if (total < MIN_VOTES) return;
        if (counts.long <= counts.short) return;
        const news = newsMap.get(newsId);
        if (!news) return;
        hotList.push({ news, long: counts.long, short: counts.short, total });
      });

      hotList.sort((a, b) => {
        if (b.long !== a.long) return b.long - a.long;
        return b.long / b.total - a.long / a.total;
      });

      setHot(hotList.slice(0, TOP_LIMIT));
    }, 100);
    return () => clearTimeout(t);
  }, [allNews]);

  return hot;
}
