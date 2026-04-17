import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseProxy";

interface CommentRow {
  id: string;
  news_id: string;
  user_id: string;
  text: string;
  likes: number;
  created_at: string;
  parent_id: string | null;
}

interface VoteAgg {
  long: number;
  short: number;
}

// Cache user to avoid repeated network calls
let cachedUser: { id: string } | null = null;
let userPromise: Promise<{ id: string } | null> | null = null;

async function getCachedUser() {
  if (cachedUser) return cachedUser;
  if (!userPromise) {
    userPromise = supabase.auth.getUser().then(({ data: { user } }) => {
      cachedUser = user ? { id: user.id } : null;
      return cachedUser;
    });
  }
  return userPromise;
}

// Listen for auth changes to invalidate cache
supabase.auth.onAuthStateChange(() => {
  cachedUser = null;
  userPromise = null;
});

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

  const addComment = async (text: string, parentId: string | null = null) => {
    const user = await getCachedUser();
    if (!user || !newsId) return false;
    const { data, error } = await supabase
      .from("news_comments")
      .insert({ news_id: newsId, user_id: user.id, text, parent_id: parentId })
      .select()
      .single();
    if (error || !data) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const display_name = profile?.display_name || "Пользователь";

    setComments((prev) =>
      prev.some((c) => c.id === data.id)
        ? prev
        : [...prev, { ...(data as CommentRow), display_name }]
    );
    return true;
  };

  return { comments, loading, addComment };
}

export function useNewsBookmark(newsId: string | null) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!newsId) return;
    let mounted = true;
    (async () => {
      const user = await getCachedUser();
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
    const user = await getCachedUser();
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
  const votingRef = useRef(false);
  const hasVoteInDb = useRef(false);

  const fetchVotes = useCallback(async () => {
    if (!newsId || votingRef.current) return;
    const { data } = await supabase
      .from("news_votes")
      .select("vote")
      .eq("news_id", newsId);

    const agg: VoteAgg = { long: 0, short: 0 };
    (data || []).forEach((v: { vote: string }) => {
      if (v.vote === "long") agg.long++;
      else agg.short++;
    });
    if (!votingRef.current) setVotes(agg);

    const user = await getCachedUser();
    if (user && !votingRef.current) {
      const { data: uv } = await supabase
        .from("news_votes")
        .select("vote")
        .eq("news_id", newsId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!votingRef.current) {
        setUserVote(uv?.vote as "long" | "short" | null);
        hasVoteInDb.current = !!uv;
      }
    }
  }, [newsId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  // No realtime for votes — it causes flicker and race conditions
  // Other users' votes will appear on next drawer open

  const vote = async (direction: "long" | "short") => {
    // Mutex: prevent concurrent votes
    if (votingRef.current) return;
    
    const user = await getCachedUser();
    if (!user || !newsId) return;
    if (userVote === direction) return;

    votingRef.current = true;

    const prevVote = userVote;
    const prevVotes = { ...votes };
    const prevHasInDb = hasVoteInDb.current;
    
    setUserVote(direction);
    setVotes(prev => {
      const next = { ...prev };
      if (prevVote) next[prevVote]--;
      next[direction]++;
      return next;
    });

    let error;
    if (hasVoteInDb.current) {
      ({ error } = await supabase
        .from("news_votes")
        .update({ vote: direction })
        .eq("news_id", newsId)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("news_votes").insert({
        news_id: newsId,
        user_id: user.id,
        vote: direction,
      }));
      if (!error) hasVoteInDb.current = true;
    }

    if (error) {
      setUserVote(prevVote);
      setVotes(prevVotes);
      hasVoteInDb.current = prevHasInDb;
    }

    votingRef.current = false;
  };

  const total = votes.long + votes.short;
  const bullPercent = total > 0 ? Math.round((votes.long / total) * 100) : 50;
  const bearPercent = total > 0 ? 100 - bullPercent : 50;

  return { votes, userVote, vote, bullPercent, bearPercent, totalVotes: total };
}
