
-- Create news_comments table
CREATE TABLE public.news_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comments"
  ON public.news_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.news_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_news_comments_news_id ON public.news_comments (news_id);

-- Create news_bookmarks table
CREATE TABLE public.news_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (news_id, user_id)
);

ALTER TABLE public.news_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON public.news_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.news_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.news_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_news_bookmarks_user_id ON public.news_bookmarks (user_id);

-- Create news_votes table
CREATE TABLE public.news_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('long', 'short')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (news_id, user_id)
);

ALTER TABLE public.news_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view votes"
  ON public.news_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON public.news_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.news_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for comments and votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_votes;
