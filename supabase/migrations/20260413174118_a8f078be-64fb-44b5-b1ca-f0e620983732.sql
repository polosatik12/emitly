
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  price_change NUMERIC NOT NULL DEFAULT 0,
  price_change_percent NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  full_date TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are viewable by everyone"
ON public.news
FOR SELECT
TO public
USING (true);
