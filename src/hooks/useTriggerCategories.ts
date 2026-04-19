import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseProxy";

export interface TriggerCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface TriggerKeyword {
  id: string;
  category_id: string;
  subgroup: string;
  keyword: string;
  weight: number;
  is_active: boolean;
}

/**
 * Загружает 4 категории триггеров (peace_deal, cb_rate, macro, reports)
 * для чипсов-фильтров на ленте и для UI админки.
 */
export function useTriggerCategories(includeKeywords = false) {
  const [categories, setCategories] = useState<TriggerCategory[]>([]);
  const [keywords, setKeywords] = useState<TriggerKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const cats = await supabase
      .from("news_trigger_categories" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    setCategories(((cats.data as any[]) ?? []) as TriggerCategory[]);

    if (includeKeywords) {
      const kws = await supabase
        .from("news_trigger_keywords" as any)
        .select("*")
        .order("subgroup", { ascending: true });
      setKeywords(((kws.data as any[]) ?? []) as TriggerKeyword[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeKeywords]);

  return { categories, keywords, loading, reload };
}
