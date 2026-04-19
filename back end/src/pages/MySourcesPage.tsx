import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Check, Plus, Lock, Loader2 } from "lucide-react";
import { NEWS_SOURCES } from "@/data/sources";
import { useSourceSubscriptions } from "@/hooks/useSourceSubscriptions";
import { usePlan, PLAN_LIMITS } from "@/hooks/usePlan";

export default function MySourcesPage() {
  const navigate = useNavigate();
  const { sources, loading, subscribe, unsubscribe, isSubscribed } = useSourceSubscriptions();
  const { planId, maxSources, hasAllSources, isBlocked } = usePlan();

  const limit = hasAllSources ? "∞" : maxSources;

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto pb-[80px] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 sticky top-0 bg-background z-10 border-b border-border">
        <button onClick={() => navigate("/profile")} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground flex-1">Мои источники</h1>
      </div>

      {/* Plan info */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground">
              Тариф {PLAN_LIMITS[planId].label}
            </p>
            <p className="text-[12.5px] text-muted-foreground">
              {hasAllSources
                ? "Доступны все источники без ограничений"
                : `Источников выбрано: ${sources.length} / ${limit}`}
            </p>
          </div>
          {!hasAllSources && (
            <button
              onClick={() => navigate("/service-catalog")}
              className="text-[12px] font-semibold text-primary px-2 py-1 rounded-md hover:bg-primary/10"
            >
              Сменить
            </button>
          )}
        </div>
      </div>

      {/* Sources list */}
      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          NEWS_SOURCES.map((src) => {
            const subscribed = isSubscribed(src.id);
            const limitReached = !hasAllSources && !subscribed && sources.length >= maxSources;
            const disabled = isBlocked || limitReached;

            return (
              <button
                key={src.id}
                onClick={() => (subscribed ? unsubscribe(src.id) : subscribe(src.id))}
                disabled={disabled || hasAllSources}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-all active:scale-[0.99] ${
                  subscribed
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-foreground/20"
                } ${disabled || hasAllSources ? "opacity-70 cursor-default" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                    subscribed ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {subscribed ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{src.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {src.category === "exclusive" ? "Эксклюзивный" : "Стандартный"}
                    </p>
                  </div>
                </div>

                {limitReached && !subscribed && (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
