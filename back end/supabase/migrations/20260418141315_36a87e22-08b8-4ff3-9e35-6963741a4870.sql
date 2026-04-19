-- Таблица прочитанных горячих новостей
CREATE TABLE public.user_read_hot_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, news_id)
);

ALTER TABLE public.user_read_hot_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own read hot news"
ON public.user_read_hot_news
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read hot news"
ON public.user_read_hot_news
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own read hot news"
ON public.user_read_hot_news
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_user_read_hot_news_user ON public.user_read_hot_news(user_id);

-- Флаги показа модалок в profiles
ALTER TABLE public.profiles
  ADD COLUMN welcome_shown BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN trial_paywall_shown BOOLEAN NOT NULL DEFAULT false;