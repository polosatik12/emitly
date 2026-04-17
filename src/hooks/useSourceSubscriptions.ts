import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseProxy";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";

export function useSourceSubscriptions() {
  const { maxSources, hasAllSources, refresh: refreshPlan } = usePlan();
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("user_source_subscriptions")
      .select("source")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setSources((data ?? []).map((r: any) => r.source));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const subscribe = useCallback(async (source: string) => {
    if (hasAllSources) {
      toast.info("На вашем тарифе доступны все источники");
      return false;
    }
    if (sources.length >= maxSources) {
      toast.error(`Лимит источников: ${maxSources}. Обновите тариф.`);
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase
      .from("user_source_subscriptions")
      .insert({ user_id: user.id, source });
    if (error) { toast.error("Не удалось подписаться"); return false; }
    setSources((p) => [...p, source]);
    refreshPlan();
    return true;
  }, [sources, maxSources, hasAllSources, refreshPlan]);

  const unsubscribe = useCallback(async (source: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_source_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("source", source);
    setSources((p) => p.filter((s) => s !== source));
    refreshPlan();
  }, [refreshPlan]);

  const isSubscribed = useCallback(
    (source: string) => hasAllSources || sources.includes(source),
    [sources, hasAllSources]
  );

  return { sources, loading, subscribe, unsubscribe, isSubscribed, refresh: load };
}
