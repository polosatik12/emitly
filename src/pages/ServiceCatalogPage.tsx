import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Bell, Globe, Headphones, Check, Minus, FileText, Copy, X, Download, Sparkles, Crown, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { downloadFile } from "@/lib/download";
import { supabase } from "@/lib/supabaseProxy";
import { toast } from "@/hooks/use-toast";
import { markPaymentPending } from "@/components/PaymentSuccessModal";
import { usePlan } from "@/hooks/usePlan";

const plans = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Полный доступ на 7 дней",
    icon: Zap,
    iconColor: "text-muted-foreground",
    borderColor: "border-border",
    popular: false,
    highlighted: false,
    isTrial: true,
    features: {
      emitters: "Все",
      notifications: "Все каналы",
      sources: "Все источники",
      support: "Общий чат",
      analytics: true,
      anomalies: true,
      insiders: true,
      exclusive: true,
      priority: false,
    },
    buttonText: "Активен 7 дней",
    buttonVariant: "outline" as const,
  },
  {
    id: "base",
    name: "Base",
    monthlyPrice: 10,
    yearlyPrice: 100,
    description: "Для начинающих инвесторов",
    icon: Zap,
    iconColor: "text-blue-500",
    borderColor: "border-border",
    popular: false,
    highlighted: false,
    isTrial: false,
    features: {
      emitters: "До 5",
      notifications: "TG · сайт · email",
      sources: "До 10",
      support: "Общий чат",
      analytics: false,
      anomalies: false,
      insiders: false,
      exclusive: false,
      priority: false,
    },
    buttonText: "Выбрать план",
    buttonVariant: "outline" as const,
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 20,
    yearlyPrice: 200,
    description: "Для активных инвесторов",
    icon: Sparkles,
    iconColor: "text-[hsl(160,84%,39%)]",
    borderColor: "border-[hsl(160,84%,39%)]",
    popular: true,
    highlighted: true,
    isTrial: false,
    features: {
      emitters: "До 20",
      notifications: "TG · сайт · email",
      sources: "До 20",
      support: "Общий чат",
      analytics: true,
      anomalies: true,
      insiders: true,
      exclusive: false,
      priority: false,
    },
    buttonText: "Выбрать план",
    buttonVariant: "primary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    description: "Максимальные возможности",
    icon: Crown,
    iconColor: "text-amber-500",
    borderColor: "border-amber-400/50",
    popular: false,
    highlighted: false,
    isTrial: false,
    features: {
      emitters: "До 50",
      notifications: "TG · сайт · email",
      sources: "Все источники",
      support: "Общий чат",
      analytics: true,
      anomalies: true,
      insiders: true,
      exclusive: false,
      priority: true,
    },
    buttonText: "Выбрать план",
    buttonVariant: "outline" as const,
  },
];

const featureRows = [
  { key: "emitters" as const, label: "Эмитенты", icon: Users },
  { key: "notifications" as const, label: "Уведомления", icon: Bell },
  { key: "sources" as const, label: "Источники", icon: Globe },
  { key: "support" as const, label: "Поддержка", icon: Headphones },
  { key: "analytics" as const, label: "Аналитика", icon: null },
  { key: "anomalies" as const, label: "Торговые аномалии", icon: null },
  { key: "insiders" as const, label: "Сделки инсайдеров", icon: null },
  { key: "priority" as const, label: "Приоритетная поддержка", icon: null },
];

const requisites = [
  { label: "Название компании", value: "КАРПОВ АЛЕКСАНДР ВИКТОРОВИЧ (ИП)" },
  { label: "Адрес", value: "улица Абрамцевская, д. 5, кв./оф. кв. 94, г. Москва" },
  { label: "ИНН", value: "771593979816" },
  { label: "Номер счёта", value: "40802810001060004432" },
  { label: "Валюта", value: "RUR" },
  { label: "Банк", value: 'АО "АЛЬФА-БАНК"' },
  { label: "БИК", value: "044525593" },
  { label: "Корреспондентский счёт", value: "30101810200000000593" },
];

const allFeatureDetails: Record<string, { label: string; value: string | boolean }[]> = {
  free: [
    { label: "Полный доступ", value: "Все функции Pro" },
    { label: "Срок", value: "7 дней с регистрации" },
    { label: "Эмитенты", value: "Без ограничений" },
    { label: "Источники", value: "Все" },
    { label: "После окончания", value: "Блокировка до оплаты" },
  ],
  base: [
    { label: "Эмитенты", value: "До 5" },
    { label: "Источники новостей", value: "До 10 на выбор" },
    { label: "Уведомления", value: "Telegram, сайт, email" },
    { label: "Поддержка", value: "Общий чат сообщества" },
    { label: "Аналитика", value: false },
    { label: "Торговые аномалии", value: false },
    { label: "Сделки инсайдеров", value: false },
    { label: "Приоритетная поддержка", value: false },
  ],
  premium: [
    { label: "Эмитенты", value: "До 20" },
    { label: "Источники новостей", value: "До 20 на выбор" },
    { label: "Уведомления", value: "Telegram, сайт, email" },
    { label: "Поддержка", value: "Общий чат сообщества" },
    { label: "Аналитика", value: true },
    { label: "Торговые аномалии", value: true },
    { label: "Сделки инсайдеров", value: true },
    { label: "Приоритетная поддержка", value: false },
  ],
  pro: [
    { label: "Эмитенты", value: "До 50" },
    { label: "Источники новостей", value: "Все источники" },
    { label: "Уведомления", value: "Telegram, сайт, email" },
    { label: "Поддержка", value: "Общий чат сообщества" },
    { label: "Аналитика", value: true },
    { label: "Торговые аномалии", value: true },
    { label: "Сделки инсайдеров", value: true },
    { label: "Приоритетная поддержка", value: true },
  ],
};

export default function ServiceCatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { planId: currentPlanId, isTrial, trialActive, expiresAt } = usePlan();
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");
  const [showRequisites, setShowRequisites] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const paymentStatus = searchParams.get("payment");
  const isCurrent = (id: string) => {
    // Платная подписка имеет приоритет над триалом
    if (!isTrial && currentPlanId !== "free") return currentPlanId === id;
    // Активный триал — «текущим» считается карточка Free
    if (isTrial && trialActive) return id === "free";
    return false;
  };
  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleOpenPlanModal = (plan: typeof plans[0]) => {
    if (plan.isTrial) {
      toast({ title: "Пробный период", description: "Пробный период активируется автоматически при регистрации." });
      return;
    }
    if (isCurrent(plan.id)) {
      toast({
        title: "Тариф уже активен",
        description: formattedExpiry
          ? `Действует до ${formattedExpiry}. Продление будет доступно после окончания.`
          : "Этот тариф уже активен.",
      });
      return;
    }
    setSelectedPlan(plan);
  };

  const handleBuyPlan = async () => {
    if (!selectedPlan) return;
    const plan = selectedPlan;

    if (isCurrent(plan.id)) {
      toast({
        title: "Тариф уже активен",
        description: formattedExpiry ? `Действует до ${formattedExpiry}.` : "Этот тариф уже активен.",
      });
      setSelectedPlan(null);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Необходима авторизация", description: "Войдите в аккаунт для оформления подписки.", variant: "destructive" });
      setSelectedPlan(null);
      navigate("/auth");
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
        // Помечаем платёж как ожидающий — глобальная PaymentSuccessModal
        // поймает активацию подписки в фоне и сразу покажет окно успеха.
        markPaymentPending();
        // Превью Lovable открывается в iframe — выходим в топ-окно,
        // иначе ЮKassa блокирует переход через X-Frame-Options.
        try {
          if (window.top && window.top !== window.self) {
            window.top.location.href = data.confirmation_url;
          } else {
            window.location.assign(data.confirmation_url);
          }
        } catch {
          window.open(data.confirmation_url, "_blank", "noopener");
        }
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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  useEffect(() => {
    // Уведомление об успешной оплате теперь показывает PaymentSuccessModal (глобально в AppLayout)
  }, [paymentStatus]);

  return (
    <div className="flex flex-col min-h-screen max-w-3xl mx-auto pb-[80px] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">Каталог услуг</h1>
      </div>

      <div className="px-4 pt-2 space-y-6">
        {/* About */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-[16px] font-bold text-foreground">О сервисе Emitly</h2>
          <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed">
            <strong className="text-foreground">Emitly</strong> — информационный сервис для инвесторов, предоставляющий агрегированную ленту новостей по российским эмитентам в режиме реального времени.
          </p>
        </div>

        {/* Plans header + toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-[18px] font-bold text-foreground">Тарифные планы</h2>
          <div className="flex items-center bg-muted rounded-xl p-1">
            <button
              onClick={() => setBillingPeriod("month")}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                billingPeriod === "month"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setBillingPeriod("year")}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                billingPeriod === "year"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Год
              <span className="ml-1 text-[11px] font-bold text-[hsl(160,84%,39%)]">−17%</span>
            </button>
          </div>
        </div>

        {/* Plan cards — horizontal scroll on mobile, grid on larger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.map((plan) => {
            const isYearly = billingPeriod === "year" && !plan.isTrial;
            const price = plan.isTrial ? 0 : (isYearly ? plan.yearlyPrice : plan.monthlyPrice);
            const period = plan.isTrial ? "48 часов" : (isYearly ? "год" : "месяц");
            const monthlyTotal = plan.monthlyPrice * 12;
            const saving = monthlyTotal - plan.yearlyPrice;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card p-5 flex flex-col transition-shadow hover:shadow-md ${
                  plan.highlighted ? `${plan.borderColor} border-2` : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="mb-3">
                    <span className="rounded-full bg-[hsl(160,84%,39%)] text-white text-[11px] font-semibold px-3 py-1">
                      Популярный
                    </span>
                  </div>
                )}

                {/* Plan name + icon */}
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-muted`}>
                    <Icon className={`h-[18px] w-[18px] ${plan.iconColor}`} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-foreground">{plan.name}</h3>
                    <p className="text-[12px] text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-[32px] font-extrabold leading-none text-foreground">
                    {price.toLocaleString("ru-RU")}₽
                  </span>
                  <span className="text-[13px] text-muted-foreground pb-1">/ {period}</span>
                </div>

                {isYearly && saving > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[14px] text-muted-foreground line-through">
                      {monthlyTotal.toLocaleString("ru-RU")}₽
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,39%)] text-[12px] font-bold px-2.5 py-0.5">
                      −{saving.toLocaleString("ru-RU")}₽
                    </span>
                  </div>
                )}

                {/* Key features summary */}
                <div className="mt-4 space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.emitters} эмитентов</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.notifications}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.sources}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px]">
                    <Headphones className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{plan.features.support}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleOpenPlanModal(plan)}
                  disabled={loadingPlan === plan.id || isCurrent(plan.id)}
                  className={`mt-5 w-full rounded-xl py-3 text-[14px] font-semibold transition-all active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed ${
                    isCurrent(plan.id)
                      ? "bg-primary/10 text-primary border-2 border-primary/30 active:scale-100 flex items-center justify-center gap-1.5"
                      : plan.buttonVariant === "primary"
                      ? "bg-[hsl(160,84%,39%)] text-white hover:opacity-90"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : isCurrent(plan.id) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
                      Текущий тариф
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-[16px] font-bold text-foreground">Сравнение тарифов</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Возможность</th>
                  {plans.map((p) => (
                    <th key={p.id} className={`text-center px-3 py-3 font-bold text-foreground min-w-[80px] ${p.highlighted ? "bg-[hsl(160,84%,39%)]/5" : ""}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, ri) => (
                  <tr key={row.key} className={ri < featureRows.length - 1 ? "border-b border-border/50" : ""}>
                    <td className="px-5 py-3 text-foreground font-medium">{row.label}</td>
                    {plans.map((plan) => {
                      const val = plan.features[row.key];
                      return (
                        <td key={plan.id} className={`text-center px-3 py-3 ${plan.highlighted ? "bg-[hsl(160,84%,39%)]/5" : ""}`}>
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="h-4 w-4 text-[hsl(160,84%,39%)] mx-auto" strokeWidth={2.5} />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )
                          ) : (
                            <span className="text-foreground">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal Info */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-[16px] font-bold text-foreground">Правовая информация</h2>
          </div>

          <div className="space-y-1 text-[13px] text-foreground">
            <p className="font-semibold">Исполнитель услуг</p>
            <p className="text-muted-foreground">ИП Карпов Александр Викторович</p>
            <p className="text-muted-foreground">ИНН: 771593979816</p>
            <p className="text-muted-foreground">Адрес: г. Москва, ул. Абрамцевская, д. 5, кв. 94</p>
          </div>

          <div className="mt-4 space-y-1 text-[13px]">
            <p className="font-semibold text-foreground">Условия оплаты</p>
            <p className="text-muted-foreground">• Оплата единовременно за выбранный период</p>
            <p className="text-muted-foreground">• Банковские карты Visa, Mastercard, МИР</p>
            <p className="text-muted-foreground">• Автоактивация после оплаты</p>
            <p className="text-muted-foreground">• Автопродление с возможностью отключения</p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => downloadFile("/docs/user-agreement.docx", "Пользовательское_соглашение.docx")}
              className="flex items-center gap-2 justify-center rounded-xl border border-border py-3 text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Пользовательское соглашение
            </button>
            <button
              onClick={() => downloadFile("/docs/privacy-policy.docx", "Политика_обработки_данных.docx")}
              className="flex items-center gap-2 justify-center rounded-xl border border-border py-3 text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Политика обработки данных
            </button>
          </div>

          <button
            onClick={() => setShowRequisites(true)}
            className="mt-2 flex items-center gap-2 w-full justify-center rounded-xl border border-border py-3 text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            Показать полные реквизиты
          </button>
        </div>

        {/* Contacts */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-[16px] font-bold text-foreground">Контакты</h2>
          </div>

          <div className="space-y-2 text-[13px]">
            <p>
              <span className="text-muted-foreground">Email: </span>
              <a href="mailto:support@emitly.ru" className="text-[hsl(160,84%,39%)]">support@emitly.ru</a>
            </p>
            <p>
              <span className="text-muted-foreground">Telegram: </span>
              <a href="https://t.me/emitly_support" className="text-[hsl(160,84%,39%)]">@emitly_support</a>
            </p>
            <p className="text-muted-foreground">Время работы: Пн-Пт 9:00-21:00 (МСК)</p>
          </div>
        </div>

        <p className="text-center text-[12px] text-muted-foreground pb-4">© 2026 Emitly</p>
      </div>

      {/* Requisites Modal */}
      {showRequisites && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowRequisites(false)}>
          <div
            className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3 sticky top-0 bg-card">
              <h3 className="text-[16px] font-bold text-foreground">Реквизиты</h3>
              <button onClick={() => setShowRequisites(false)} className="p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 pb-6 divide-y divide-border">
              {requisites.map((item, i) => (
                <div key={i} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-muted-foreground">{item.label}</p>
                    <p className="text-[14px] text-foreground mt-0.5 break-words">{item.value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.value, i)}
                    className="p-1.5 shrink-0 mt-2"
                  >
                    {copiedIndex === i ? (
                      <Check className="h-4 w-4 text-[hsl(160,84%,39%)]" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setSelectedPlan(null)}>
          <div
            className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3 sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted">
                  <selectedPlan.icon className={`h-[18px] w-[18px] ${selectedPlan.iconColor}`} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-foreground">{selectedPlan.name}</h3>
                  <p className="text-[12px] text-muted-foreground">{selectedPlan.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Price */}
            <div className="px-5 pb-4">
              <div className="flex items-end gap-2">
                <span className="text-[28px] font-extrabold leading-none text-foreground">
                  {(billingPeriod === "year" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice).toLocaleString("ru-RU")}₽
                </span>
                <span className="text-[13px] text-muted-foreground pb-1">
                  / {billingPeriod === "year" ? "год" : "месяц"}
                </span>
              </div>
              {billingPeriod === "year" && (
                <p className="text-[12px] text-muted-foreground mt-1">
                  ≈ {Math.round(selectedPlan.yearlyPrice / 12).toLocaleString("ru-RU")}₽/мес
                </p>
              )}
            </div>

            {/* Features list */}
            <div className="px-5 pb-5 space-y-3">
              <p className="text-[13px] font-semibold text-foreground">Что включено:</p>
              {allFeatureDetails[selectedPlan.id]?.map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px]">
                  {typeof feat.value === "boolean" ? (
                    feat.value ? (
                      <Check className="h-4 w-4 text-[hsl(160,84%,39%)] shrink-0" strokeWidth={2.5} />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )
                  ) : (
                    <Check className="h-4 w-4 text-[hsl(160,84%,39%)] shrink-0" strokeWidth={2.5} />
                  )}
                  <span className={typeof feat.value === "boolean" && !feat.value ? "text-muted-foreground" : "text-foreground"}>
                    {feat.label}{typeof feat.value === "string" ? `: ${feat.value}` : ""}
                  </span>
                </div>
              ))}
            </div>

            {/* Buy button */}
            <div className="px-5 pb-6">
              <button
                onClick={handleBuyPlan}
                disabled={loadingPlan === selectedPlan.id}
                className="w-full rounded-xl py-3.5 text-[15px] font-semibold bg-[hsl(160,84%,39%)] text-white hover:opacity-90 transition-all active:scale-[0.97] disabled:opacity-60"
              >
                {loadingPlan === selectedPlan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  `Купить за ${(billingPeriod === "year" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice).toLocaleString("ru-RU")}₽`
                )}
              </button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Оплата через ЮKassa · Visa, Mastercard, МИР
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}