import { useState } from "react";
import { Lock, Sparkles, Crown, Zap, Check, Loader2, Users, Bell, Globe } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/lib/supabaseProxy";
import { toast } from "@/hooks/use-toast";
import { markPaymentPending } from "@/components/PaymentSuccessModal";

const PAYWALL_PLANS = [
  {
    id: "base",
    name: "Base",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    description: "Для начинающих инвесторов",
    icon: Zap,
    iconColor: "text-blue-500",
    highlighted: false,
    popular: false,
    features: { emitters: "До 5", sources: "До 10", notifications: "TG · сайт · email" },
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    description: "Для активных инвесторов",
    icon: Sparkles,
    iconColor: "text-[hsl(160,84%,39%)]",
    highlighted: true,
    popular: true,
    features: { emitters: "До 20", sources: "До 20", notifications: "TG · сайт · email" },
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    description: "Максимальные возможности",
    icon: Crown,
    iconColor: "text-amber-500",
    highlighted: false,
    popular: false,
    features: { emitters: "До 50", sources: "Все источники", notifications: "TG · сайт · email" },
  },
];

/**
 * Глобальная модалка-блокер: триал Free закончился, нужно купить подписку.
 * Не закрывается без оплаты. Показывает все тарифы с прямой кнопкой оплаты.
 */
export default function TrialPaywallModal() {
  const { isBlocked, loading } = usePlan();
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (loading || !isBlocked) return null;

  const handleBuy = async (plan: typeof PAYWALL_PLANS[0]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Необходима авторизация", variant: "destructive" });
      return;
    }
    const isYearly = billingPeriod === "year";
    const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const period = isYearly ? "year" : "month";
    const description = `Emitly ${plan.name} — ${isYearly ? "годовая" : "месячная"} подписка`;

    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { planId: plan.id, period, amount, description },
      });
      if (error) throw error;
      if (data?.confirmation_url) {
        // Помечаем платёж как ожидающий — модалка успеха откроется автоматически,
        // как только webhook ЮKassa активирует подписку (даже если юзер не вернулся).
        markPaymentPending();
        // Если приложение открыто в iframe (превью Lovable) — выходим в топ-окно,
        // иначе ЮKassa блокирует переход через X-Frame-Options.
        try {
          if (window.top && window.top !== window.self) {
            window.top.location.href = data.confirmation_url;
          } else {
            window.location.assign(data.confirmation_url);
          }
        } catch {
          // Кросс-доменный iframe — открываем в новой вкладке
          window.open(data.confirmation_url, "_blank", "noopener");
        }
        return;
      } else {
        throw new Error("No confirmation URL received");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({ title: "Ошибка оплаты", description: err.message || "Попробуйте позже", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8 rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" strokeWidth={2.2} />
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-foreground mt-4">
            Пробный период закончился
          </h2>
          <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed max-w-xl">
            Чтобы продолжить пользоваться Emitly — выберите тариф ниже. Оплата картой РФ через ЮKassa.
          </p>

          <div className="mt-4 rounded-xl bg-muted/50 px-4 py-2.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[12.5px] text-muted-foreground">
              Годовая подписка выгоднее на ~17%
            </p>
          </div>
        </div>

        {/* Period toggle */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center bg-muted rounded-xl p-1">
            <button
              onClick={() => setBillingPeriod("month")}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                billingPeriod === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setBillingPeriod("year")}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                billingPeriod === "year" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Год
              <span className="ml-1 text-[11px] font-bold text-[hsl(160,84%,39%)]">−17%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAYWALL_PLANS.map((plan) => {
            const isYearly = billingPeriod === "year";
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = isYearly ? "год" : "месяц";
            const monthlyTotal = plan.monthlyPrice * 12;
            const saving = monthlyTotal - plan.yearlyPrice;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card p-5 flex flex-col ${
                  plan.highlighted ? "border-[hsl(160,84%,39%)] border-2" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[hsl(160,84%,39%)] text-white text-[11px] font-semibold px-3 py-1 shadow">
                      Популярный
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted">
                    <Icon className={`h-[18px] w-[18px] ${plan.iconColor}`} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground">{plan.name}</h3>
                    <p className="text-[12px] text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-[28px] font-extrabold leading-none text-foreground">
                    {price.toLocaleString("ru-RU")}₽
                  </span>
                  <span className="text-[13px] text-muted-foreground pb-0.5">/ {period}</span>
                </div>

                {isYearly && saving > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground line-through">
                      {monthlyTotal.toLocaleString("ru-RU")}₽
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,39%)] text-[11px] font-bold px-2 py-0.5">
                      −{saving.toLocaleString("ru-RU")}₽
                    </span>
                  </div>
                )}

                <div className="mt-4 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.emitters} эмитентов</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.sources}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.notifications}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(plan)}
                  disabled={loadingPlan !== null}
                  className={`mt-5 w-full rounded-xl py-3 text-[14px] font-semibold transition-all active:scale-[0.97] disabled:opacity-60 ${
                    plan.highlighted
                      ? "bg-[hsl(160,84%,39%)] text-white hover:opacity-90"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    "Оплатить"
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-[11.5px] text-muted-foreground">
          Нажимая «Оплатить», вы соглашаетесь с условиями подписки. Платежи обрабатывает ЮKassa.
        </p>
      </div>
    </div>
  );
}
