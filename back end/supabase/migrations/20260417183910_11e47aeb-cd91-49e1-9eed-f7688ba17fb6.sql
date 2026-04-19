DROP POLICY IF EXISTS "Anyone authenticated can view votes" ON public.news_votes;
CREATE POLICY "Anyone can view votes"
  ON public.news_votes
  FOR SELECT
  USING (true);