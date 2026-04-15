import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MoexPriceData {
  price: number;
  change: number;
  changePercent: number;
}

export type MoexPricesMap = Record<string, MoexPriceData>;

interface MoexCache {
  prices: MoexPricesMap;
  currencies: MoexPricesMap;
  at: number;
}

let cache: MoexCache = { prices: {}, currencies: {}, at: 0 };
let fetchPromise: Promise<MoexCache> | null = null;

const POLL_INTERVAL = 30_000;
const CACHE_TTL = 25_000;

async function fetchAll(): Promise<MoexCache> {
  const now = Date.now();
  if (cache.at && now - cache.at < CACHE_TTL && Object.keys(cache.prices).length > 0) {
    return cache;
  }

  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("moex-prices");
      if (error) throw error;
      const d = data as { prices: MoexPricesMap; currencies: MoexPricesMap };
      cache = { prices: d.prices ?? {}, currencies: d.currencies ?? {}, at: Date.now() };
      return cache;
    } catch (e) {
      console.error("Failed to fetch MOEX prices:", e);
      return cache;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useMoexPrices() {
  const [prices, setPrices] = useState<MoexPricesMap>(cache.prices);
  const [currencies, setCurrencies] = useState<MoexPricesMap>(cache.currencies);
  const [loading, setLoading] = useState(Object.keys(cache.prices).length === 0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    const result = await fetchAll();
    setPrices(result.prices);
    setCurrencies(result.currencies);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  return { prices, currencies, loading, refresh };
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
  }
  return price.toFixed(2) + " ₽";
}
