import * as React from "react";

const MOBILE_BREAKPOINT = 1024;
const STORAGE_KEY = "emitly_force_layout"; // 'mobile' | 'desktop' | null

/**
 * Определяет, мобильное ли это устройство.
 * Считаем мобильным, если: UA мобильный ИЛИ ширина окна < 768px.
 *
 * Это покрывает:
 *  - Реальные телефоны (UA mobile)
 *  - Lovable preview / DevTools mobile / узкие окна (ширина < 768)
 *  - Telegram Mini App (узкая ширина)
 *
 * Override через URL: ?layout=desktop | mobile | auto
 *  - desktop / mobile — форсируют на текущую сессию (сохраняется в localStorage)
 *  - auto — сбрасывает сохранённый override
 *
 * Защита от «залипшего» mobile: если в storage стоит mobile, но и UA десктоп,
 * и ширина ≥ 768 — запись автоматически удаляется.
 */
function detectUaMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  const isIPadOS = ua.includes("Macintosh") && (navigator as any).maxTouchPoints > 1;
  return uaMobile || isIPadOS;
}

function detectIsMobile(): boolean {
  if (typeof window === "undefined") return false;

  const uaIsMobile = detectUaMobile();
  const widthIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const naturallyMobile = uaIsMobile || widthIsMobile;

  try {
    const url = new URL(window.location.href);
    const force = url.searchParams.get("layout");

    if (force === "auto") {
      localStorage.removeItem(STORAGE_KEY);
    } else if (force === "desktop") {
      localStorage.setItem(STORAGE_KEY, "desktop");
      return false;
    } else if (force === "mobile") {
      localStorage.setItem(STORAGE_KEY, "mobile");
      return true;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "desktop") return false;
    if (stored === "mobile") {
      // Защита: не позволяем «залипшему» mobile-override превратить десктоп в мобилку.
      if (!naturallyMobile) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      return true;
    }
  } catch {}

  return naturallyMobile;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(detectIsMobile);

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const update = () => setIsMobile(detectIsMobile());

    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(update, 100);
    };

    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("orientationchange", update);

    // Синхронизация на маунте (на случай, если SSR/hydration вернул не то)
    update();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobile;
}

export { MOBILE_BREAKPOINT };
