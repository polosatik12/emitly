import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, Zap, Clock, Hourglass } from "lucide-react";
import { usePlan, PLAN_LIMITS, type PlanId } from "@/hooks/usePlan";

const PLAN_VISUAL: Record<PlanId, { icon: typeof Zap; color: string; bg: string; ring: string }> = {
  free:    { icon: Hourglass, color: "text-muted-foreground", bg: "bg-muted", ring: "border-border" },
  base:    { icon: Zap,       color: "text-blue-500",         bg: "bg-blue-500/10", ring: "border-blue-500/30" },
  premium: { icon: Sparkles,  color: "text-primary",          bg: "bg-primary/10",  ring: "border-primary/30" },
  pro:     { icon: Crown,     color: "text-amber-500",        bg: "bg-amber-500/10", ring: "border-amber-500/30" },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calcRemaining(target: Date): Remaining {
  const totalMs = Math.max(0, target.getTime() - Date.now());
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-background rounded-xl border border-border px-2 py-2 min-w-[58px]">
      <span className="text-[20px] font-extrabold text-foreground tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function SubscriptionCard() {
  const navigate = useNavigate();
  const { planId, isTrial, trialActive, expiresAt, isBlocked, loading } = usePlan();
  const [, force] = useState(0);

  // Тик каждую секунду для таймера
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-20 animate-pulse bg-muted/50 rounded-xl" />
      </div>
    );
  }

  // Блокировка (триал истёк, нет подписки)
  if (isBlocked) {
    return (
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/15">
            <Hourglass className="h-[18px] w-[18px] text-destructive" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-foreground">Подписка не активна</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">Пробный период закончился</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/service-catalog")}
          className="mt-3 w-full rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-primary-foreground active:scale-[0.97] transition-transform"
        >
          Выбрать тариф
        </button>
      </div>
    );
  }

  // Активный тариф (платный или триал)
  const isPaid = !isTrial && planId !== "free";
  const effectivePlanId: PlanId = isPaid ? planId : "free";
  const visual = PLAN_VISUAL[effectivePlanId];
  const Icon = visual.icon;
  const planLabel = isPaid
    ? `Emitly ${PLAN_LIMITS[effectivePlanId].label}`
    : trialActive
      ? "Пробный период"
      : null;

  // Если это free без триала и без подписки — карточку не показываем (старт триала идёт через WelcomeModal)
  if (!planLabel) return null;

  const target = expiresAt ? new Date(expiresAt) : null;
  const rem = target ? calcRemaining(target) : null;
  const formatted = formatDate(expiresAt);
  const expired = rem !== null && rem.totalMs <= 0;

  return (
    <div className={`rounded-2xl border-2 bg-card p-4 ${visual.ring}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${visual.bg}`}>
          <Icon className={`h-[18px] w-[18px] ${visual.color}`} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground">{planLabel}</p>
          <p className="text-[12.5px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={2} />
            {formatted ? `Действует до ${formatted}` : "Активна"}
          </p>
        </div>
        {isPaid && (
          <span className={`hidden sm:inline-flex rounded-full ${visual.bg} ${visual.color} text-[11px] font-bold px-2.5 py-1`}>
            Активна
          </span>
        )}
      </div>

      {rem && !expired && (
        <>
          <div className="mt-3.5 grid grid-cols-4 gap-2">
            <CountdownCell value={rem.days} label="дней" />
            <CountdownCell value={rem.hours} label="часов" />
            <CountdownCell value={rem.minutes} label="минут" />
            <CountdownCell value={rem.seconds} label="сек" />
          </div>
          <p className="mt-2.5 text-[11.5px] text-center text-muted-foreground">
            До окончания {isTrial ? "пробного периода" : "подписки"}
          </p>
        </>
      )}

      {/* CTA: апгрейд для триала, продление для платных */}
      <button
        onClick={() => navigate("/service-catalog")}
        className={`mt-3.5 w-full rounded-xl py-2.5 text-[13.5px] font-semibold transition-transform active:scale-[0.97] ${
          isPaid
            ? "border border-border bg-background text-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {isPaid ? "Сменить или продлить тариф" : "Купить подписку"}
      </button>
    </div>
  );
}
