import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { usePlan, PLAN_LIMITS, type PlanId } from "@/hooks/usePlan";

const PENDING_KEY = "emitly_pending_payment";
const PENDING_TTL_MS = 30 * 60 * 1000; // 30 минут

/** Помечаем, что пользователь ушёл оплачивать — слушатель ниже поймает активацию плана. */
export function markPaymentPending() {
  try {
    localStorage.setItem(PENDING_KEY, String(Date.now()));
  } catch {}
}

function getPendingTs(): number | null {
  try {
    const v = localStorage.getItem(PENDING_KEY);
    if (!v) return null;
    const ts = Number(v);
    if (!Number.isFinite(ts)) return null;
    if (Date.now() - ts > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return ts;
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

/**
 * Глобальная модалка успеха оплаты. Открывается в трёх случаях:
 *  1) Возврат с ЮKassa с ?payment=success.
 *  2) Webhook ЮKassa активировал подписку, пока пользователь был на ЮKassa
 *     (флаг pending_payment в localStorage + поллинг плана в фоне).
 *  3) Возврат вкладки в фокус с активным pending_payment — мгновенный refresh.
 */
export default function PaymentSuccessModal() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { planId, isTrial, refresh, expiresAt, loading } = usePlan();
  const [open, setOpen] = useState(false);
  // Снимок плана на момент открытия модалки (чтобы не мигало при рефрешах)
  const [snapshotPlan, setSnapshotPlan] = useState<PlanId | null>(null);
  const [snapshotExpiry, setSnapshotExpiry] = useState<string | null>(null);

  const initialPlanRef = useRef<PlanId | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const urlSuccess = params.get("payment") === "success";

  // Запоминаем стартовый план (для детекта апгрейда после оплаты)
  useEffect(() => {
    if (loading) return;
    if (initialPlanRef.current === null) {
      initialPlanRef.current = planId;
    }
  }, [loading, planId]);

  // Открываем модалку, когда план апгрейднулся с free на платный
  // (либо явный возврат с ЮKassa).
  useEffect(() => {
    if (loading || open) return;
    const isPaid = !isTrial && planId !== "free";
    const pending = getPendingTs();

    if (urlSuccess || (pending && isPaid)) {
      if (isPaid) {
        setSnapshotPlan(planId);
        setSnapshotExpiry(expiresAt);
        clearPending();
      }
      setOpen(true);
    }
  }, [urlSuccess, planId, isTrial, expiresAt, loading, open]);

  // Фоновый поллинг плана пока есть pending_payment
  useEffect(() => {
    const startPolling = () => {
      if (pollTimerRef.current != null) return;
      const tick = async () => {
        const pending = getPendingTs();
        if (!pending) {
          if (pollTimerRef.current != null) {
            window.clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          return;
        }
        await refresh();
      };
      // первый рефреш сразу
      void tick();
      pollTimerRef.current = window.setInterval(tick, 3000) as unknown as number;
    };

    const stopPolling = () => {
      if (pollTimerRef.current != null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    if (getPendingTs()) startPolling();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && getPendingTs()) {
        void refresh();
        startPolling();
      }
    };
    const onFocus = () => onVisibility();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  // Если открыли через ?payment=success, но план ещё не активен — продолжаем дополнительно поллить
  useEffect(() => {
    if (!open || snapshotPlan) return;
    let attempts = 0;
    const id = window.setInterval(async () => {
      attempts += 1;
      await refresh();
      if (attempts >= 30) window.clearInterval(id); // ~90 секунд
    }, 3000);
    return () => window.clearInterval(id);
  }, [open, snapshotPlan, refresh]);

  // Когда модалка открыта и план наконец активировался — фиксируем снимок
  useEffect(() => {
    if (!open || snapshotPlan) return;
    if (!isTrial && planId !== "free") {
      setSnapshotPlan(planId);
      setSnapshotExpiry(expiresAt);
      clearPending();
    }
  }, [open, snapshotPlan, planId, isTrial, expiresAt]);

  if (!open) return null;

  const planLabel = snapshotPlan ? PLAN_LIMITS[snapshotPlan]?.label : null;
  const formattedExpiry = snapshotExpiry
    ? new Date(snapshotExpiry).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleClose = () => {
    setOpen(false);
    if (params.get("payment")) {
      params.delete("payment");
      setParams(params, { replace: true });
    }
    initialPlanRef.current = planId;
  };

  const handleGoToNews = () => {
    handleClose();
    navigate("/news");
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-7 animate-in zoom-in-95 duration-300 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
          <CheckCircle2 className="h-9 w-9 text-primary" strokeWidth={2.2} />
        </div>

        <h2 className="text-[22px] font-extrabold text-foreground mt-5">
          Спасибо за покупку!
        </h2>

        {planLabel ? (
          <>
            <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
              Оплата прошла успешно. Ваш тариф:
            </p>
            <div className="mt-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="text-[20px] font-extrabold text-foreground">
                Emitly {planLabel}
              </div>
              {formattedExpiry && (
                <div className="text-[12px] text-muted-foreground">
                  Действует до {formattedExpiry}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed">
            Активируем вашу подписку — это займёт несколько секунд…
          </p>
        )}

        <button
          onClick={handleGoToNews}
          className="mt-6 w-full rounded-xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground active:scale-[0.97] transition-transform hover:opacity-95"
        >
          Перейти к новостям
        </button>
        <button
          onClick={handleClose}
          className="mt-2 w-full rounded-xl py-3 text-[13.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
