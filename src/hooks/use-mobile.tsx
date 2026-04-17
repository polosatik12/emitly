import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const STORAGE_KEY = "emitly_force_layout"; // 'mobile' | 'desktop' | null

/**
 * Считаем устройство мобильным только когда это РЕАЛЬНЫЙ мобильный/планшет:
 * UA указывает на мобильную ОС ИЛИ есть touch + узкая ширина.
 * На десктопе (даже в узком окне браузера или iframe превью) — всегда desktop UI.
 *
 * Можно форсировать через ?layout=desktop|mobile (сохраняется в localStorage).
 */
function detectIsMobile(): boolean {
  if (typeof window === "undefined") return false;

  // 1) Явный override из URL: ?layout=desktop|mobile
  try {
    const url = new URL(window.location.href);
    const force = url.searchParams.get("layout");
    if (force === "desktop") {
      localStorage.setItem(STORAGE_KEY, "desktop");
      return false;
    }
    if (force === "mobile") {
      localStorage.setItem(STORAGE_KEY, "mobile");
      return true;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "desktop") return false;
    if (stored === "mobile") return true;
  } catch {}

  const ua = navigator.userAgent || "";
  const uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);

  // iPadOS 13+ маскируется под Mac — ловим по touch
  const isIPadOS = ua.includes("Macintosh") && (navigator as any).maxTouchPoints > 1;

  if (uaMobile || isIPadOS) return true;

  // На десктопе ширина окна не определяет мобильную версию
  return false;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(detectIsMobile);

  React.useEffect(() => {
    const onChange = () => setIsMobile(detectIsMobile());
    window.addEventListener("orientationchange", onChange);
    return () => window.removeEventListener("orientationchange", onChange);
  }, []);

  return isMobile;
}

export { MOBILE_BREAKPOINT };
