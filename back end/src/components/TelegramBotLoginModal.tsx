import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseProxy";
import { toast } from "sonner";
import { Send, X, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Status = "loading" | "waiting" | "confirmed" | "expired" | "error";

/**
 * Модалка входа через нового Telegram-бота:
 * 1. Запрашивает одноразовый токен у tg-login-start
 * 2. Открывает t.me/<bot>?start=<token>
 * 3. Опрашивает tg-login-poll каждые 2 секунды
 * 4. Когда бот пометил токен как confirmed — устанавливает сессию и редиректит
 */
export default function TelegramBotLoginModal({ open, onClose }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus("loading");
    setDeepLink(null);
    setErrorMessage(null);
    tokenRef.current = null;

    const start = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("tg-login-start", {
          body: {},
        });
        if (error) throw new Error(error.message || "Не удалось создать ссылку входа");
        if (!data?.token || !data?.deep_link) throw new Error("Сервер не вернул ссылку");

        if (cancelled) return;
        tokenRef.current = data.token;
        setDeepLink(data.deep_link);
        setBotUsername(data.bot_username ?? null);
        setStatus("waiting");

        pollRef.current = window.setInterval(() => {
          void pollOnce();
        }, 2000);
      } catch (e: any) {
        if (cancelled) return;
        setErrorMessage(e?.message || "Ошибка подготовки входа");
        setStatus("error");
      }
    };

    const pollOnce = async () => {
      const token = tokenRef.current;
      if (!token) return;
      try {
        const { data, error } = await supabase.functions.invoke("tg-login-poll", {
          body: { token },
        });
        if (error) throw new Error(error.message);

        if (data?.status === "confirmed" && data?.session?.access_token) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus("confirmed");

          const { error: setErr } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          if (setErr) throw setErr;

          toast.success("Вы успешно вошли через Telegram");
          setTimeout(() => {
            onClose();
            navigate("/news");
          }, 600);
          return;
        }

        if (data?.status === "expired") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus("expired");
        }
      } catch (e) {
        // silent — продолжаем поллинг
        console.warn("tg-login-poll:", e);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open, navigate, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#2AABEE]" />
            </div>
            <span className="font-semibold text-foreground">Вход через Telegram</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          {status === "loading" && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Готовим ссылку…</p>
            </div>
          )}

          {status === "waiting" && deepLink && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Откройте бота{botUsername ? ` @${botUsername}` : ""} и нажмите кнопку{" "}
                <span className="font-semibold text-foreground">Start</span>. Как только бот подтвердит,
                вы автоматически войдёте на сайт.
              </p>

              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
                Открыть Telegram
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ожидаем нажатие Start в боте…
              </div>
            </div>
          )}

          {status === "confirmed" && (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 mx-auto text-primary" />
              <p className="text-sm text-foreground font-semibold">Вы успешно авторизованы</p>
              <p className="text-xs text-muted-foreground">Перенаправляем…</p>
            </div>
          )}

          {status === "expired" && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-foreground">Ссылка истекла</p>
              <button
                onClick={() => {
                  // re-open by toggling
                  setStatus("loading");
                  setDeepLink(null);
                  setTimeout(() => {
                    // trigger the effect again by closing and re-opening
                    onClose();
                  }, 100);
                }}
                className="text-sm text-primary font-medium hover:underline"
              >
                Закрыть и попробовать снова
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-destructive">{errorMessage || "Ошибка"}</p>
              <button
                onClick={onClose}
                className="text-sm text-primary font-medium hover:underline"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
