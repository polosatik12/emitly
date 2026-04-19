-- 1. Категории триггеров
CREATE TABLE public.news_trigger_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'hsl(160 84% 39%)',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news_trigger_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view trigger categories"
ON public.news_trigger_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert trigger categories"
ON public.news_trigger_categories FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update trigger categories"
ON public.news_trigger_categories FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete trigger categories"
ON public.news_trigger_categories FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER trg_news_trigger_categories_updated
BEFORE UPDATE ON public.news_trigger_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Ключевые слова и подгруппы
CREATE TABLE public.news_trigger_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.news_trigger_categories(id) ON DELETE CASCADE,
  subgroup TEXT NOT NULL DEFAULT 'main',
  keyword TEXT NOT NULL,
  weight INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, keyword)
);

ALTER TABLE public.news_trigger_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view trigger keywords"
ON public.news_trigger_keywords FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert trigger keywords"
ON public.news_trigger_keywords FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update trigger keywords"
ON public.news_trigger_keywords FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete trigger keywords"
ON public.news_trigger_keywords FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER trg_news_trigger_keywords_updated
BEFORE UPDATE ON public.news_trigger_keywords
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trigger_keywords_category ON public.news_trigger_keywords(category_id);
CREATE INDEX idx_trigger_keywords_subgroup ON public.news_trigger_keywords(category_id, subgroup);

-- 3. Поле сработавших триггеров в новостях
ALTER TABLE public.news
  ADD COLUMN trigger_categories TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

CREATE INDEX idx_news_trigger_categories ON public.news USING GIN(trigger_categories);

-- 4. Сырые новости
CREATE TABLE public.raw_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_slug TEXT,
  source_name TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  trigger_categories TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  matched_keywords TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_processed BOOLEAN NOT NULL DEFAULT false,
  news_id UUID REFERENCES public.news(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.raw_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view raw news"
ON public.raw_news FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can insert raw news"
ON public.raw_news FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update raw news"
ON public.raw_news FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete raw news"
ON public.raw_news FOR DELETE TO authenticated USING (is_admin());

CREATE INDEX idx_raw_news_published_at ON public.raw_news(published_at DESC);
CREATE INDEX idx_raw_news_categories ON public.raw_news USING GIN(trigger_categories);
CREATE INDEX idx_raw_news_source ON public.raw_news(source_slug);

-- 5. Сидим 4 категории
INSERT INTO public.news_trigger_categories (code, name, description, color, sort_order) VALUES
  ('peace_deal', 'Мирное соглашение', 'Перемирие, договорённости, гарантии безопасности', 'hsl(160 84% 39%)', 1),
  ('cb_rate',    'Ставка ЦБ',         'Решения по ключевой ставке, ДКП и forward guidance', 'hsl(217 91% 60%)', 2),
  ('macro',      'Макро',             'Инфляция, ВВП, бюджет, нефть, санкции', 'hsl(38 92% 50%)', 3),
  ('reports',    'Отчётность',        'Финансовые отчёты, дивиденды, M&A, байбеки', 'hsl(280 65% 60%)', 4);

-- 6. Сидим ключевые слова

-- Peace Deal
INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Ключевые', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'мирное соглашение','peace deal','прекращение огня','ceasefire','перемирие',
  'подписание соглашения','договорённости о мире','рамочное соглашение','гарантии безопасности'
]) AS kw WHERE code = 'peace_deal';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Усиливающие', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'подписали','достигли','согласовали','официально','при посредничестве',
  'ООН','Турция','США','ЕС','Китай','вступает в силу'
]) AS kw WHERE code = 'peace_deal';

-- Ставка ЦБ
INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Прямые', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'ключевая ставка','ставка ЦБ','Банк России','денежно-кредитная политика','ДКП'
]) AS kw WHERE code = 'cb_rate';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Действия', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'снижение','повышение','сохранение','смягчение','ужесточение','пауза'
]) AS kw WHERE code = 'cb_rate';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Forward guidance', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'дальнейшее снижение','пространство для снижения','достижение пика',
  'инфляционные риски снижаются','инфляция замедляется','проинфляционные риски'
]) AS kw WHERE code = 'cb_rate';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Макро-связки', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'инфляция','инфляционные ожидания','кредитование','потребительский спрос','денежная масса'
]) AS kw WHERE code = 'cb_rate';

-- Макро
INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Инфляция', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'инфляция','CPI','дефляция','замедление инфляции','рост инфляции'
]) AS kw WHERE code = 'macro';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Экономика', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'ВВП','рецессия','экономический рост','деловая активность','PMI','индекс деловой активности'
]) AS kw WHERE code = 'macro';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Бюджет', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'дефицит бюджета','профицит','нефтегазовые доходы','бюджетное правило','ФНБ','госрасходы'
]) AS kw WHERE code = 'macro';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Внешние факторы', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'цены на нефть','Brent','санкции','ограничения','экспорт','импорт'
]) AS kw WHERE code = 'macro';

-- Отчётность
INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Отчётность', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'финансовая отчетность','МСФО','РСБУ','отчет за','результаты'
]) AS kw WHERE code = 'reports';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Показатели', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'выручка','чистая прибыль','EBITDA','FCF','маржинальность','долговая нагрузка','ND/EBITDA'
]) AS kw WHERE code = 'reports';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Дивиденды', kw, 2 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'дивиденды','дивидендная политика','рекомендовал','дивиденд','выплата'
]) AS kw WHERE code = 'reports';

INSERT INTO public.news_trigger_keywords (category_id, subgroup, keyword, weight)
SELECT id, 'Корпоративные действия', kw, 1 FROM public.news_trigger_categories, UNNEST(ARRAY[
  'байбек','обратный выкуп','SPO','допэмиссия','реорганизация','сделка','M&A','поглощение'
]) AS kw WHERE code = 'reports';