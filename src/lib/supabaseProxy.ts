import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const PROXY_URL = "https://emitly.ru/api";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Proxied client — all requests go through VPS
export const supabase = createClient<Database>(PROXY_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
