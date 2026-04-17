import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Newspaper, Bell, TrendingUp, BarChart3, Check } from "lucide-react";
import { supabase } from "@/lib/supabaseProxy";
import { usePlan } from "@/hooks/usePlan";
import { useAuthReady } from "@/hooks/useAuthReady";

/**
 * Приветственное модальное окно.
 * Показывается на КАЖДОМ входе и переходе по приложению,
 * пока у профиля trial_started_at = NULL (триал не активирован).
 * Скрывается только на странице тарифов /service-catalog,
 * чтобы пользователь мог оформить подписку.
 */
export default function WelcomeModal() {
  const { user, isAuthReady } = useAuthReady();
  const { trialStartedAt, loading, refresh } = usePlan();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);

  const trialNotStarted = isAuthReady && !!user && !loading && !trialStartedAt;
  const onPlansPage = location.pathname.startsWith("/service-catalog");
  const onAuthPage = location.pathname.startsWith("/auth") || location.pathname === "/";

  // Сбрасываем шаг каждый раз когда окно открывается заново
  useEffect(() => {
    if (trialNotStarted && !onPlansPage && !onAuthPage) setStep(0);
  }, [location.pathname, trialNotStarted, onPlansPage, onAuthPage]);

  if (!trialNotStarted || onPlansPage || onAuthPage) return null;

  const startTrial = async () => {
    setBusy(true);
    try {
      await supabase.rpc("start_trial_if_needed" as any);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const goToPlans = () => {
    // Просто переходим к тарифам — на этой странице окно само скроется.
    // Если пользователь уйдёт обратно не оформив, окно появится снова.
    navigate("/service-catalog");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {step === 0 ? (
          <div className="p-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5 shadow-lg shadow-primary/30">
              <Sparkles className="w-7 h-7 text-primary-foreground" strokeWidth={2.2} />
            </div>

            <h2 className="text-[22px] font-extrabold text-foreground tracking-tight mb-2">
              Добро пожаловать в <span className="text-primary">Emit</span>ly!
            </h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">
              Сервис мгновенных новостей и аналитики по российским эмитентам. Вот что вы получите:
            </p>

            <div className="space-y-3 mb-7">
              <Feature icon={<Newspaper className="w-4 h-4" />} title="Лента новостей" desc="События по 55 крупнейшим эмитентам в реальном времени" />
              <Feature icon={<Bell className="w-4 h-4" />} title="Push и Telegram-уведомления" desc="Узнавайте о важных событиях первыми" />
              <Feature icon={<BarChart3 className="w-4 h-4" />} title="Аналитика и фундаментал" desc="P/E, EV/EBITDA, графики, мнения сообщества" />
              <Feature icon={<TrendingUp className="w-4 h-4" />} title="Голосование Long/Short" desc="Видите настроение рынка по каждой новости" />
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Далее
            </button>
          </div>
        ) : (
          <div className="p-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5 shadow-lg shadow-primary/30">
              <span className="text-[22px]">🎁</span>
            </div>

            <h2 className="text-[22px] font-extrabold text-foreground tracking-tight mb-2">
              7 дней Pro — бесплатно
            </h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">
              Мы дарим вам пробный период с полным доступом — без оплаты и без ввода карты.
            </p>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6 space-y-2.5">
              <BulletItem text="Все 55 эмитентов в подписках" />
              <BulletItem text="Доступ ко всем источникам новостей" />
              <BulletItem text="Уведомления в Telegram и на email" />
              <BulletItem text="Полная аналитика и фундаментал" />
            </div>

            <button
              onClick={startTrial}
              disabled={busy}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 mb-3"
            >
              {busy ? "Запускаем…" : "Начать 7 дней бесплатно"}
            </button>

            <button
              onClick={goToPlans}
              disabled={busy}
              className="w-full text-center text-[13.5px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
            >
              Сразу выбрать тариф →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-foreground leading-tight mb-0.5">{title}</div>
        <div className="text-[12px] text-muted-foreground leading-snug">{desc}</div>
      </div>
    </div>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-primary" strokeWidth={3} />
      </div>
      <span className="text-[13px] text-foreground">{text}</span>
    </div>
  );
}
