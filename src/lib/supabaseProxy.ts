import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PROXY_URL = "https://emitly.ru/api";

export const supabase = createClient<Database>(PROXY_URL, SUPABASE_KEY, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
});
