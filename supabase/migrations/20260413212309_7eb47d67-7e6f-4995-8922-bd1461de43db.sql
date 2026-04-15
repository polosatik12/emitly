CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view chat messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert their own chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chat_messages_created_at_desc
ON public.chat_messages (created_at DESC);

CREATE INDEX idx_chat_messages_user_id_created_at
ON public.chat_messages (user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;