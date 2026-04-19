CREATE TABLE public.notifications_read (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  news_id TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, news_id)
);

ALTER TABLE public.notifications_read ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own read notifications"
ON public.notifications_read
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read notifications"
ON public.notifications_read
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own read notifications"
ON public.notifications_read
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_read_user ON public.notifications_read(user_id);