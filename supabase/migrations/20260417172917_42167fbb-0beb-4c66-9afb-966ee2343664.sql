-- Расширяем таблицу news для приёма с внешнего парсера
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}'::text[];

-- Уникальный индекс по source_url для дедупликации (NULL-ы не конфликтуют)
CREATE UNIQUE INDEX IF NOT EXISTS news_source_url_unique
  ON public.news (source_url)
  WHERE source_url IS NOT NULL;

-- Индекс для сортировки ленты
CREATE INDEX IF NOT EXISTS news_published_at_idx
  ON public.news (published_at DESC NULLS LAST);
