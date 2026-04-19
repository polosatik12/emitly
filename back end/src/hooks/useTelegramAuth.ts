import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseProxy";
import type { Session } from "@supabase/supabase-js";

interface TelegramWebApp {
  initData?: string;
  ready: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const TELEGRAM_INITDATA_PARAM = "tgWebAppData";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getInitDataFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search);
  const fromSearch = search.get(TELEGRAM_INITDATA_PARAM);
  if (fromSearch) return safeDecode(fromSearch);

  const hashRaw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!hashRaw) return null;

  const hashParams = new URLSearchParams(hashRaw);
  const fromHash = hashParams.get(TELEGRAM_INITDATA_PARAM);
  return fromHash ? safeDecode(fromHash) : null;
}

async function waitForTelegramWebApp(maxAttempts = 20, delayMs = 100): Promise<TelegramWebApp | undefined> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const webApp = window.Telegram?.WebApp;
    if (webApp) return webApp;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return undefined;
}

async function waitForInitData(maxAttempts = 20, delayMs = 100): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const sdkData = window.Telegram?.WebApp?.initData?.trim();
    if (sdkData) return sdkData;

    const urlData = getInitDataFromUrl();
    if (urlData) return urlData;

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return "";
}

export function useTelegramAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!isMounted) return;
      setSession(authSession);
    });

    const initialize = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;
        setSession(currentSession);

        const webApp = await waitForTelegramWebApp();
        const initDataFromSdk = webApp?.initData?.trim() || "";
        const initDataFromUrl = getInitDataFromUrl() || "";
        const initData = initDataFromSdk || initDataFromUrl || (await waitForInitData());

        const hasInitData = Boolean(initData);
        const telegramDetected =
          (Boolean(webApp) && hasInitData) ||
          Boolean(initDataFromUrl) ||
          hasInitData;

        if (!isMounted) return;
        setIsTelegram(telegramDetected);

        if (!telegramDetected) {
          setError(null);
          setLoading(false);
          return;
        }

        if (!initData) {
          setSession(null);
          setError("Открой мини-апп через кнопку в боте Telegram");
          setLoading(false);
          return;
        }

        try {
          webApp?.ready?.();
          webApp?.expand?.();
        } catch {
          // ignore Telegram SDK UI errors
        }

        const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
        if (signOutError) {
          console.warn("Telegram auth signOut warning:", signOutError.message);
        }

        const { data, error: invokeError } = await supabase.functions.invoke("telegram-auth", {
          body: { initData },
        });

        if (invokeError) throw new Error(invokeError.message || "Telegram auth invoke failed");

        const accessToken = data?.session?.access_token as string | undefined;
        const refreshToken = data?.session?.refresh_token as string | undefined;

        if (!accessToken || !refreshToken) {
          throw new Error("Сервер не вернул токены сессии");
        }

        const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionError) throw setSessionError;

        if (!isMounted) return;
        setSession(setSessionData.session);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Ошибка авторизации через Telegram";
        console.error("Telegram auth error:", message);
        setSession(null);
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, error, isTelegram };
}
