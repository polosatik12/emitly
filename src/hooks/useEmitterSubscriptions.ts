import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseProxy";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";

const EVENT = "emitter-subs-changed";

export function useEmitterSubscriptions() {
  const { maxEmitters, isBlocked, trialActive, planId, loading: planLoading, refresh: refreshPlan } = usePlan();
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

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [load]);

  const subscribe = useCallback(async (ticker: string) => {
    if (planLoading) {
      toast.message("Загрузка тарифа, попробуйте ещё раз");
      return false;
    }
    // Нет активного доступа: ни триала, ни платного плана — ведём в тарифы
    const noAccess = !trialActive && (planId === "free" || isBlocked) && maxEmitters === 0;
    if (noAccess) {
      toast.error(isBlocked
        ? "Пробный период закончился. Оформите подписку."
        : "Запустите пробный период или выберите тариф, чтобы подписываться на эмитентов."
      );
      return false;
    }
    if (subscriptions.length >= maxEmitters) {
      toast.error(`Лимит эмитентов: ${maxEmitters}. Обновите тариф.`);
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Войдите в аккаунт");
      return false;
    }
    const { error } = await supabase.from("emitter_subscriptions").insert({ user_id: user.id, ticker });
    if (error) {
      toast.error(error.message || "Не удалось подписаться");
      return false;
    }
    setSubscriptions((prev) => [...prev, ticker]);
    toast.success("Подписка оформлена");
    window.dispatchEvent(new Event(EVENT));
    refreshPlan();
    return true;
  }, [subscriptions, maxEmitters, isBlocked, trialActive, planId, planLoading, refreshPlan]);

  const unsubscribe = useCallback(async (ticker: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("emitter_subscriptions").delete().eq("user_id", user.id).eq("ticker", ticker);
    setSubscriptions((prev) => prev.filter((t) => t !== ticker));
    toast.success("Подписка отменена");
    window.dispatchEvent(new Event(EVENT));
    refreshPlan();
  }, [refreshPlan]);

  const isSubscribed = useCallback((ticker: string) => subscriptions.includes(ticker), [subscriptions]);

  return { subscriptions, loading, subscribe, unsubscribe, isSubscribed, refresh: load };
}
