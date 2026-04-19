import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, ChevronRight, HelpCircle, FileText, DollarSign, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseProxy";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import RequisitesModal from "@/components/RequisitesModal";
import SubscriptionCard from "@/components/SubscriptionCard";

interface ProfileCardData {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  email: string;
}

const defaultProfileCard: ProfileCardData = {
  displayName: "Пользователь",
  username: "@user",
  avatarUrl: null,
  email: "",
};

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const pricingPlans = [
  {
    name: "Free",
    monthlyPrice: "0",
    yearlyPrice: "0",
    features: [
      "Полный доступ ко всем функциям Pro",
      "Все эмитенты и источники",
      "Уведомления: TG · сайт · email",
      "После окончания — блокировка до оплаты",
    ],
    isCurrent: true,
    isPopular: false,
    isPro: false,
    isTrial: true,
  },
  {
    name: "Base",
    monthlyPrice: "199",
    yearlyPrice: "1990",
    features: [
      "До 5 эмитентов",
      "До 10 источников на выбор",
      "Уведомления: TG · сайт · email",
      "Поддержка: общий чат",
    ],
    isCurrent: false,
    isPopular: false,
    isPro: false,
    isTrial: false,
  },
  {
    name: "Premium",
    monthlyPrice: "299",
    yearlyPrice: "2990",
    features: [
      "До 20 эмитентов",
      "До 20 источников на выбор",
      "Уведомления: TG · сайт · email",
      "Аналитика и торговые аномалии",
      "Сделки инсайдеров",
    ],
    isCurrent: false,
    isPopular: true,
    isPro: false,
    isTrial: false,
  },
  {
    name: "Pro",
    monthlyPrice: "499",
    yearlyPrice: "4990",
    features: [
      "До 50 эмитентов",
      "Все источники",
      "Уведомления: TG · сайт · email",
      "Аналитика и торговые аномалии",
      "Приоритетная поддержка",
    ],
    isCurrent: false,
    isPopular: false,
    isPro: true,
    isTrial: false,
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profileCard, setProfileCard] = useState<ProfileCardData>(defaultProfileCard);
  const [showRequisites, setShowRequisites] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");

  // Settings form state (desktop inline)
  const [settingsName, setSettingsName] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) return;

      setUserId(user.id);

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaDisplayName = typeof metadata.display_name === "string" ? metadata.display_name.trim() : "";
      const metaUsername = typeof metadata.telegram_username === "string" ? metadata.telegram_username.replace(/^@/, "").trim() : "";
      const metaAvatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url.trim() : "";
      const emailPrefix = (user.email ?? "").split("@")[0]?.replace(/^tg_/, "id") || "";

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      const displayName = dbProfile?.display_name?.trim() || metaDisplayName || "Пользователь";
      const usernameValue = (metaUsername || emailPrefix || "user").replace(/^@/, "");
      const avatarUrl = dbProfile?.avatar_url || metaAvatarUrl || null;

      setProfileCard({
        displayName,
        username: `@${usernameValue}`,
        avatarUrl,
        email: user.email ?? "",
      });

      // Pre-fill settings form
      setSettingsName(displayName !== "Пользователь" ? displayName : "");
      setSettingsPhone((dbProfile as any)?.phone ?? "");
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
    if (!userId) return;
    setSavingSettings(true);

    try {
      const trimmedName = settingsName.trim();
      const trimmedPhone = settingsPhone.trim();

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName || null,
          phone: trimmedPhone || null,
        } as any)
        .eq("user_id", userId);

      if (error) throw error;

      // Update the displayed card
      if (trimmedName) {
        setProfileCard((prev) => ({ ...prev, displayName: trimmedName }));
      }

      toast.success("Данные сохранены");
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error("Не удалось сохранить данные");
    } finally {
      setSavingSettings(false);
    }
  };

  const containerClass = isMobile
    ? "flex flex-col min-h-screen max-w-lg md:max-w-3xl mx-auto pb-[60px] bg-background"
    : "flex flex-col min-h-screen max-w-[640px] mx-auto py-6 px-6 bg-background";

  return (
    <div className={containerClass}>
      {/* Header — only on mobile */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button onClick={() => navigate("/news")} className="p-1 active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-[17px] font-bold text-foreground">Профиль</h1>
          <button onClick={() => navigate("/settings")} className="p-1">
            <Settings className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* Desktop title */}
      {!isMobile && (
        <h1 className="text-[24px] font-bold text-foreground mb-5">Профиль</h1>
      )}

      <div className={isMobile ? "px-4 pt-2 space-y-3" : "space-y-3"}>
        {/* User card */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-border overflow-hidden">
              {profileCard.avatarUrl ? (
                <img
                  src={profileCard.avatarUrl}
                  alt={profileCard.displayName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-[17px] font-bold text-muted-foreground">{getInitials(profileCard.displayName)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold text-foreground">{profileCard.displayName}</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{profileCard.username}</p>
              {!isMobile && profileCard.email && (
                <p className="text-[12px] text-muted-foreground mt-0.5">{profileCard.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Активная подписка с таймером */}
        <SubscriptionCard />

        {/* Saved news / Theme / Telegram notifications переехали в Настройки */}

        {/* Quick links row on desktop */}
        {!isMobile && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.open("mailto:support@emitly.ru", "_blank")}>
              <div className="flex items-center justify-center gap-2">
                <HelpCircle className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
                <span className="text-[14px] font-medium text-foreground">Поддержка</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/service-catalog")}>
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
                <span className="text-[14px] font-medium text-foreground">Каталог</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowRequisites(true)}>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
                <span className="text-[14px] font-medium text-foreground">Реквизиты</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick links on mobile */}
        {isMobile && (
          <>
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer" onClick={() => window.open("mailto:support@emitly.ru", "_blank")}>
              <div className="flex items-center justify-center gap-2">
                <HelpCircle className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
                <span className="text-[14px] font-medium text-foreground">Поддержка</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer" onClick={() => navigate("/service-catalog")}>
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
                <span className="text-[14px] font-medium text-foreground">Каталог услуг</span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer" onClick={() => setShowRequisites(true)}>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
                <span className="text-[14px] font-medium text-foreground">Реквизиты</span>
              </div>
            </div>
          </>
        )}

        {/* Logout — теперь только в Настройках на всех устройствах */}

        {/* Pricing section */}
        <div className="pt-3">
          <h2 className="text-[18px] font-bold text-foreground">Тарифные планы</h2>
          <p className="text-[13px] text-primary mt-1">Выберите подходящий план подписки</p>
          
          {/* Billing period toggle */}
          <div className="flex items-center gap-2 mt-3 bg-muted rounded-xl p-1 w-fit">
            <button
              onClick={() => setBillingPeriod("month")}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                billingPeriod === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setBillingPeriod("year")}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors relative ${
                billingPeriod === "year" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Год
              <span className="ml-1.5 text-[11px] font-bold text-primary">−17%</span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className={`pb-6 ${isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}`}>
          {pricingPlans.map((plan) => {
            const isYearly = billingPeriod === "year" && !plan.isTrial;
            const displayPrice = plan.isTrial ? "0" : (isYearly ? plan.yearlyPrice : plan.monthlyPrice);
            const period = plan.isTrial ? "/ 7 дней" : (isYearly ? "/ год" : "/ месяц");
            const monthlyTotal = Number(plan.monthlyPrice) * 12;
            const yearlySaving = monthlyTotal - Number(plan.yearlyPrice);
            
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-5 bg-card ${
                  plan.isPopular
                    ? "border-primary border-2"
                    : plan.isPro
                    ? "border-primary/40"
                    : "border-border"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary/80 px-4 py-1.5 text-[12px] font-semibold text-primary-foreground">
                      Популярный
                    </span>
                  </div>
                )}

                <p className={`text-[16px] font-bold ${plan.isPro ? "text-primary" : "text-foreground"}`}>
                  {plan.name}
                </p>

                <div className="mt-2 flex items-baseline gap-1">
                  {isYearly && (
                    <span className="text-[18px] font-bold text-muted-foreground line-through mr-1">
                      {monthlyTotal}₽
                    </span>
                  )}
                  <span className="text-[28px] font-extrabold leading-none text-foreground">{displayPrice}₽</span>
                  <span className="text-[14px] text-muted-foreground">{period}</span>
                </div>

                {isYearly && yearlySaving > 0 && (
                  <div className="mt-1.5">
                    <span className="inline-block rounded-full bg-primary/10 text-primary text-[12px] font-semibold px-3 py-1">
                      Выгода {yearlySaving}₽
                    </span>
                  </div>
                )}

                <div className="mt-4 space-y-2.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="h-[16px] w-[16px] shrink-0 mt-0.5 text-primary" strokeWidth={2} />
                      <span className="text-[13px] text-foreground leading-snug">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`mt-5 w-full rounded-xl py-3 text-[14px] font-semibold transition-transform active:scale-[0.97] ${
                    plan.isCurrent
                      ? "bg-muted text-muted-foreground"
                      : plan.isPro
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {plan.isCurrent ? "Текущий план" : "Выбрать план"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <RequisitesModal open={showRequisites} onClose={() => setShowRequisites(false)} />
    </div>
  );
}
