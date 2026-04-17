ALTER TABLE public.news_comments
ADD COLUMN parent_id UUID REFERENCES public.news_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_news_comments_parent_id ON public.news_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON public.news_comments(news_id);