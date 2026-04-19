-- Table for one-time login tokens issued when user clicks "Login via Telegram"
CREATE TABLE public.telegram_login_tokens (
  token TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | consumed | expired
  telegram_user_id BIGINT,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes')
);

CREATE INDEX idx_tg_login_tokens_status ON public.telegram_login_tokens(status);
CREATE INDEX idx_tg_login_tokens_expires ON public.telegram_login_tokens(expires_at);

ALTER TABLE public.telegram_login_tokens ENABLE ROW LEVEL SECURITY;

-- No public access — only service role (edge functions) reads/writes this table
CREATE POLICY "No public access to login tokens"
ON public.telegram_login_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- Singleton state for getUpdates polling offset for the NEW bot
CREATE TABLE public.telegram_login_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_login_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_login_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to login bot state"
ON public.telegram_login_bot_state
FOR ALL
USING (false)
WITH CHECK (false);