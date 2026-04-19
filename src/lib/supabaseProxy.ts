import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_URL_DIRECT = import.meta.env.VITE_SUPABASE_URL;
const PROXY_URL = "https://emitly.ru/api";

/**
 * Proxy через VPS работает только с прод-домена emitly.ru (CORS на Nginx).
 * На превью Lovable / localhost прокси падает с Failed to fetch — поэтому
 * там используем прямой URL Supabase. В проде остаётся прокси для скорости в РФ.
 */
function resolveBaseUrl(): string {
  if (typeof window === "undefined") return SUPABASE_URL_DIRECT;
  const host = window.location.hostname;
  const isProd = host === "emitly.ru" || host.endsWith(".emitly.ru");
  return isProd ? PROXY_URL : SUPABASE_URL_DIRECT;
}

export const supabase = createClient<Database>(resolveBaseUrl(), SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
