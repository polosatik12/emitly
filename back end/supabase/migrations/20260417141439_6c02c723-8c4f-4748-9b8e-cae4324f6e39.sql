
-- 1. Расширяем profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notify_telegram BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_web BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- 2. Таблица подписок на источники новостей
CREATE TABLE IF NOT EXISTS public.user_source_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source)
);

ALTER TABLE public.user_source_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own source subs"
  ON public.user_source_subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own source subs"
  ON public.user_source_subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own source subs"
  ON public.user_source_subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_source_subs_user ON public.user_source_subscriptions(user_id);

-- 3. RPC: запустить триал, если ещё не запускался
CREATE OR REPLACE FUNCTION public.start_trial_if_needed()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  ts TIMESTAMPTZ;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT trial_started_at INTO ts FROM public.profiles WHERE user_id = uid;

  IF ts IS NULL THEN
    UPDATE public.profiles
       SET trial_started_at = now()
     WHERE user_id = uid
     RETURNING trial_started_at INTO ts;
  END IF;

  RETURN ts;
END;
$$;

-- 4. RPC: текущий план + лимиты + статус триала
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  plan_id TEXT,
  is_trial BOOLEAN,
  trial_active BOOLEAN,
  trial_days_left INT,
  trial_started_at TIMESTAMPTZ,
  is_blocked BOOLEAN,
  max_emitters INT,
  max_sources INT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  uid UUID := COALESCE(_user_id, auth.uid());
  active_plan TEXT;
  active_expires TIMESTAMPTZ;
  trial_ts TIMESTAMPTZ;
  trial_left INT;
  trial_is_active BOOLEAN := false;
  blocked BOOLEAN := false;
  m_emit INT;
  m_src INT;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT 'free'::TEXT, true, false, 0, NULL::TIMESTAMPTZ, true, 0, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Активная платная подписка (последняя по сроку)
  SELECT s.plan_id, s.expires_at
    INTO active_plan, active_expires
  FROM public.subscriptions s
  WHERE s.user_id = uid
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY s.expires_at DESC NULLS LAST
  LIMIT 1;

  -- Триал
  SELECT p.trial_started_at INTO trial_ts FROM public.profiles p WHERE p.user_id = uid;

  IF trial_ts IS NOT NULL THEN
    trial_left := GREATEST(0, 7 - EXTRACT(DAY FROM (now() - trial_ts))::INT);
    trial_is_active := (now() < trial_ts + INTERVAL '7 days');
  ELSE
    trial_left := 7;
    trial_is_active := false; -- ещё не запущен
  END IF;

  IF active_plan IS NOT NULL THEN
    -- Платный план
    CASE active_plan
      WHEN 'base'    THEN m_emit := 5;  m_src := 10;
      WHEN 'premium' THEN m_emit := 20; m_src := 20;
      WHEN 'pro'     THEN m_emit := 50; m_src := 9999;
      ELSE                m_emit := 5;  m_src := 10;
    END CASE;
    RETURN QUERY SELECT active_plan, false, trial_is_active, trial_left, trial_ts, false, m_emit, m_src, active_expires;
  ELSIF trial_is_active THEN
    -- Активный триал = доступ как Pro
    RETURN QUERY SELECT 'free'::TEXT, true, true, trial_left, trial_ts, false, 50, 9999, trial_ts + INTERVAL '7 days';
  ELSE
    -- Free без активного триала: либо ещё не запускали, либо триал истёк
    blocked := (trial_ts IS NOT NULL); -- если триал был и истёк — блок
    RETURN QUERY SELECT 'free'::TEXT, true, false, trial_left, trial_ts, blocked, 0, 0, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_trial_if_needed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_plan(UUID) TO authenticated;
