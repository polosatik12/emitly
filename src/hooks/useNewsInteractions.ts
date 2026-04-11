import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CommentRow {
  id: string;
  news_id: string;
  user_id: string;
  text: string;
  likes: number;
  created_at: string;
}

interface VoteAgg {
  long: number;
  short: number;
}

export function useNewsComments(newsId: string | null) {
  const [comments, setComments] = useState<(CommentRow & { display_name: string })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!newsId) return;
    setLoading(true);
    const { data } = await supabase
      .from("news_comments")
      .select("*")
      .eq("news_id", newsId)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c: CommentRow) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.display_name || "Пользователь"])
      );

      setComments(
        data.map((c: CommentRow) => ({
          ...c,
          display_name: profileMap.get(c.user_id) || "Пользователь",
        }))
      );
    } else {
      setComments([]);
    }
    setLoading(false);
  }, [newsId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
  useEffect(() => {
    if (!newsId) return;
    const channel = supabase
      .channel(`comments-${newsId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news_comments", filter: `news_id=eq.${newsId}` },
        () => fetchComments()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [newsId, fetchComments]);

  const addComment = async (text: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newsId) return false;
    const { error } = await supabase.from("news_comments").insert({
      news_id: newsId,
      user_id: user.id,
      text,
    });
    return !error;
  };

  return { comments, loading, addComment };
}

export function useNewsBookmark(newsId: string | null) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!newsId) return;
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const { data } = await supabase
        .from("news_bookmarks")
        .select("id")
        .eq("news_id", newsId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (mounted) setIsBookmarked(!!data);
    })();
    return () => { mounted = false; };
  }, [newsId]);

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newsId) return;
    if (isBookmarked) {
      await supabase.from("news_bookmarks").delete().eq("news_id", newsId).eq("user_id", user.id);
      setIsBookmarked(false);
    } else {
      await supabase.from("news_bookmarks").insert({ news_id: newsId, user_id: user.id });
      setIsBookmarked(true);
    }
  };

  return { isBookmarked, toggleBookmark };
}

export function useNewsVotes(newsId: string | null) {
  const [votes, setVotes] = useState<VoteAgg>({ long: 0, short: 0 });
  const [userVote, setUserVote] = useState<"long" | "short" | null>(null);

  const fetchVotes = useCallback(async () => {
    if (!newsId) return;
    const { data } = await supabase
      .from("news_votes")
      .select("vote")
      .eq("news_id", newsId);

    const agg: VoteAgg = { long: 0, short: 0 };
    (data || []).forEach((v: { vote: string }) => {
      if (v.vote === "long") agg.long++;
      else agg.short++;
    });
    setVotes(agg);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: uv } = await supabase
        .from("news_votes")
        .select("vote")
        .eq("news_id", newsId)
        .eq("user_id", user.id)
        .maybeSingle();
      setUserVote(uv?.vote as "long" | "short" | null);
    }
  }, [newsId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  useEffect(() => {
    if (!newsId) return;
    const channel = supabase
      .channel(`votes-${newsId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_votes", filter: `news_id=eq.${newsId}` },
        () => fetchVotes()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [newsId, fetchVotes]);

  const vote = async (direction: "long" | "short") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newsId) return;

    if (userVote === direction) return; // already voted same

    if (userVote) {
      // Update existing vote
      await supabase
        .from("news_votes")
        .update({ vote: direction })
        .eq("news_id", newsId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("news_votes").insert({
        news_id: newsId,
        user_id: user.id,
        vote: direction,
      });
    }
    setUserVote(direction);
    await fetchVotes();
  };

  const total = votes.long + votes.short;
  const bullPercent = total > 0 ? Math.round((votes.long / total) * 100) : 50;
  const bearPercent = total > 0 ? 100 - bullPercent : 50;

  return { votes, userVote, vote, bullPercent, bearPercent, totalVotes: total };
}
