import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Bookmark, ChevronRight, Sun, Bell, HelpCircle, FileText, DollarSign, Check, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import RequisitesModal from "@/components/RequisitesModal";

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
    name: "Бесплатный",
    price: "0₽",
    period: "/ 48 часов",
    features: [
      "1 эмитент в подписке",
      "Базовая лента новостей",
      "Доступ к основным источникам",
    ],
    isCurrent: true,
    isPopular: false,
    isPro: false,
  },
  {
    name: "Base",
    price: "199₽",
    period: "/ месяц",
    features: [
      "5 эмитентов в подписке",
      "Мгновенные уведомления",
      "Расширенный список источников",
    ],
    isCurrent: false,
    isPopular: false,
    isPro: false,
  },
  {
    name: "Premium",
    price: "299₽",
    period: "/ месяц",
    features: [
      "20 эмитентов в подписке",
      "Все функции Base",
      "Персональная поддержка",
      "Аналитика и статистика",
      "Торговые аномалии и крупные сделки",
    ],
    isCurrent: false,
    isPopular: true,
    isPro: false,
  },
  {
    name: "Pro",
    price: "499₽",
    period: "/ месяц",
    features: [
      "50 эмитентов в подписке",
      "Все функции Premium",
      "Эксклюзивные источники",
      "Расширенная аналитика",
      "Приоритетная поддержка",
    ],
    isCurrent: false,
    isPopular: false,
    isPro: true,
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [telegramNotifs, setTelegramNotifs] = useState(true);
  const [profileCard, setProfileCard] = useState<ProfileCardData>(defaultProfileCard);
  const [showRequisites, setShowRequisites] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted || !user) return;

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaDisplayName = typeof metadata.display_name === "string" ? metadata.display_name.trim() : "";
      const metaUsername = typeof metadata.telegram_username === "string" ? metadata.telegram_username.replace(/^@/, "").trim() : "";
      const metaAvatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url.trim() : "";
      const emailPrefix = (user.email ?? "").split("@")[0]?.replace(/^tg_/, "id") || "";

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
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
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    navigate("/");
  };

  const containerClass = isMobile
    ? "flex flex-col min-h-screen max-w-lg mx-auto pb-[60px] bg-background"
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

        {/* Saved news */}
        <div className="rounded-2xl border border-border bg-card p-4 active:scale-[0.98] transition-transform cursor-pointer" onClick={() => navigate("/saved-news")}>
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
              <Bookmark className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Сохранённые новости</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Статьи для чтения позже</p>
            </div>
            <ChevronRight className="h-[18px] w-[18px] text-muted-foreground shrink-0" strokeWidth={1.8} />
          </div>
        </div>

        {/* Theme toggle */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
              <Sun className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Тема</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{darkMode ? "Тёмная" : "Светлая"}</p>
            </div>
            <button
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                document.documentElement.classList.toggle("dark", next);
              }}
              className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform ${darkMode ? "translate-x-[25px]" : "translate-x-[3px]"}`} />
            </button>
          </div>
        </div>

        {/* Telegram notifications */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent">
              <Bell className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Telegram уведомления</p>
              <p className="text-[13px] text-primary mt-0.5">{telegramNotifs ? "Включены" : "Выключены"}</p>
            </div>
            <button
              onClick={() => setTelegramNotifs(!telegramNotifs)}
              className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors ${telegramNotifs ? "bg-primary" : "bg-muted"}`}
            >
              <div className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform ${telegramNotifs ? "translate-x-[25px]" : "translate-x-[3px]"}`} />
            </button>
          </div>
        </div>

        {/* Quick links row on desktop */}
        {!isMobile && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors">
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
            <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-destructive/30 bg-card px-4 py-3.5 hover:bg-destructive/10 transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <LogOut className="h-[17px] w-[17px] text-destructive" strokeWidth={1.8} />
            <span className="text-[14px] font-medium text-destructive">Выйти из аккаунта</span>
          </div>
        </button>

        {/* Pricing section */}
        <div className="pt-3">
          <h2 className="text-[18px] font-bold text-foreground">Тарифные планы</h2>
          <p className="text-[13px] text-primary mt-1">Выберите подходящий план подписки</p>
        </div>

        {/* Pricing cards */}
        <div className={`pb-6 ${isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}`}>
          {pricingPlans.map((plan) => (
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
                <span className="text-[28px] font-extrabold leading-none text-foreground">{plan.price}</span>
                <span className="text-[14px] text-muted-foreground">{plan.period}</span>
              </div>

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
          ))}
        </div>
      </div>
      <RequisitesModal open={showRequisites} onClose={() => setShowRequisites(false)} />
    </div>
  );
}
