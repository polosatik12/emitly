-- 1. ROLES SYSTEM
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. NEWS SOURCES TABLE
CREATE TABLE public.news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  url TEXT,
  source_type TEXT NOT NULL DEFAULT 'rss',
  tier TEXT NOT NULL DEFAULT 'primary',
  is_active BOOLEAN NOT NULL DEFAULT true,
  parse_interval_min INTEGER NOT NULL DEFAULT 15,
  triggers JSONB NOT NULL DEFAULT '{"keywords": [], "tickers": [], "exclude_keywords": [], "min_length": 0}'::jsonb,
  description TEXT,
  icon_url TEXT,
  last_parsed_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sources"
ON public.news_sources FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert sources"
ON public.news_sources FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update sources"
ON public.news_sources FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete sources"
ON public.news_sources FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER update_news_sources_updated_at
BEFORE UPDATE ON public.news_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. LINK NEWS TO SOURCES
ALTER TABLE public.news ADD COLUMN source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL;
ALTER TABLE public.news ADD COLUMN source_slug TEXT;
CREATE INDEX idx_news_source_id ON public.news(source_id);
CREATE INDEX idx_news_source_slug ON public.news(source_slug);

-- 4. SEED INITIAL SOURCES
INSERT INTO public.news_sources (slug, name, tier) VALUES
  ('rbc',         'РБК',               'primary'),
  ('interfax',    'Интерфакс',         'primary'),
  ('tass',        'ТАСС',              'primary'),
  ('vedomosti',   'Ведомости',         'primary'),
  ('smartlab',    'Smart-Lab',         'primary'),
  ('finam',       'Финам',             'primary'),
  ('kommersant',  'Коммерсантъ',       'primary'),
  ('forbes',      'Forbes',            'primary'),
  ('edisclosure', 'E-Disclosure',      'primary'),
  ('moex',        'MOEX',              'primary'),
  ('banki',       'Banki.ru',          'extra'),
  ('frankmedia',  'Frank Media',       'extra'),
  ('investing',   'Investing.com',     'extra'),
  ('bloomberg',   'Bloomberg',         'extra'),
  ('reuters',     'Reuters',           'extra'),
  ('ft',          'Financial Times',   'extra'),
  ('wsj',         'WSJ',               'extra'),
  ('cbr',         'ЦБ РФ',             'extra'),
  ('minfin',      'Минфин',            'extra'),
  ('fns',         'ФНС',               'extra'),
  ('rosstat',     'Росстат',           'extra'),
  ('tg_invest',   'TG: Инвест-каналы', 'extra'),
  ('tg_insider',  'TG: Инсайдеры',     'extra'),
  ('boards',      'Советы директоров', 'extra'),
  ('scanner',     'Сканер аномалий',   'extra');