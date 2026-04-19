import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseProxy";

export type PlanId = "free" | "base" | "premium" | "pro";

export interface PlanInfo {
  planId: PlanId;
  isTrial: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
  trialStartedAt: string | null;
  isBlocked: boolean;        // триал истёк, активной подписки нет
  maxEmitters: number;
  maxSources: number;
  expiresAt: string | null;
  loading: boolean;
  /** список источников, на которые пользователь подписан (для лимитов / блюра) */
  sourceSubs: string[];
  /** Имеет ли план доступ ко всем источникам без явной подписки (Pro/триал) */
  hasAllSources: boolean;
  refresh: () => Promise<void>;
  /** Проверка, доступен ли источник (для применения блюра в карточках) */
  isSourceAllowed: (source?: string | null) => boolean;
}

const defaultInfo: PlanInfo = {
  planId: "free",
  isTrial: true,
  trialActive: false,
  trialDaysLeft: 7,
  trialStartedAt: null,
  isBlocked: false,
  maxEmitters: 0,
  maxSources: 0,
  expiresAt: null,
  loading: true,
  sourceSubs: [],
  hasAllSources: false,
  refresh: async () => {},
  isSourceAllowed: () => true,
};

const PlanContext = createContext<PlanInfo>(defaultInfo);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<PlanInfo, "refresh" | "isSourceAllowed" | "hasAllSources">>({
    ...defaultInfo,
  });

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    // Триал стартует только по явному клику в WelcomeModal — не автоматически.

    const [planRes, srcRes] = await Promise.all([
      supabase.rpc("get_user_plan" as any),
      supabase.from("user_source_subscriptions").select("source").eq("user_id", user.id),
    ]);

    const row: any = Array.isArray(planRes.data) ? planRes.data[0] : planRes.data;
    const sources = (srcRes.data ?? []).map((r: any) => r.source);

    setState({
      planId: (row?.plan_id ?? "free") as PlanId,
      isTrial: !!row?.is_trial,
      trialActive: !!row?.trial_active,
      trialDaysLeft: row?.trial_days_left ?? 0,
      trialStartedAt: row?.trial_started_at ?? null,
      isBlocked: !!row?.is_blocked,
      maxEmitters: row?.max_emitters ?? 0,
      maxSources: row?.max_sources ?? 0,
      expiresAt: row?.expires_at ?? null,
      loading: false,
      sourceSubs: sources,
    });
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e) => {
      setTimeout(() => load(), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const value = useMemo<PlanInfo>(() => {
    const hasAllSources = state.planId === "pro" || (state.isTrial && state.trialActive);
    const isSourceAllowed = (src?: string | null) => {
      if (!src) return true;
      if (hasAllSources) return true;
      // Без активной подписки и без триала источники недоступны (блок Free).
      if (state.isBlocked) return false;
      return state.sourceSubs.includes(src);
    };
    return {
      ...state,
      hasAllSources,
      refresh: load,
      isSourceAllowed,
    };
  }, [state, load]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}

export const PLAN_LIMITS: Record<PlanId, { emitters: number; sources: number | "all"; label: string }> = {
  free:    { emitters: 0,  sources: 0,    label: "Free" },
  base:    { emitters: 5,  sources: 10,   label: "Base" },
  premium: { emitters: 20, sources: 20,   label: "Premium" },
  pro:     { emitters: 50, sources: "all", label: "Pro" },
};
