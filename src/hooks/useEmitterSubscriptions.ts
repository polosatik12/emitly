import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseProxy";

export function useEmitterSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("emitter_subscriptions")
      .select("ticker")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setSubscriptions((data ?? []).map((r) => r.ticker));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const subscribe = useCallback(async (ticker: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("emitter_subscriptions").insert({ user_id: user.id, ticker });
    setSubscriptions((prev) => [...prev, ticker]);
  }, []);

  const unsubscribe = useCallback(async (ticker: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("emitter_subscriptions").delete().eq("user_id", user.id).eq("ticker", ticker);
    setSubscriptions((prev) => prev.filter((t) => t !== ticker));
  }, []);

  const isSubscribed = useCallback((ticker: string) => subscriptions.includes(ticker), [subscriptions]);

  return { subscriptions, loading, subscribe, unsubscribe, isSubscribed, refresh: load };
}
