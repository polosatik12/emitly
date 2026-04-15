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
}

function mapRow(row: any): NewsItem {
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
    bullPercent: 50,
    bearPercent: 50,
    comments: 0,
    commentsList: [],
  };
}

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (mounted) {
        setNews((data || []).map(mapRow));
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { news, loading };
}
