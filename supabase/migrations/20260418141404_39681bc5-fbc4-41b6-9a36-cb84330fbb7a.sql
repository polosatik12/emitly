ALTER TABLE public.user_read_hot_news REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_read_hot_news;