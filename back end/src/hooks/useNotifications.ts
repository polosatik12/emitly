import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseProxy";
import { useEmitterSubscriptions } from "@/hooks/useEmitterSubscriptions";
import { useNews, type NewsItem } from "@/hooks/useNews";

export interface NotificationItem extends NewsItem {
  isRead: boolean;
}

export function useNotifications() {
  const { news, loading: newsLoading } = useNews();
  const { subscriptions, loading: subsLoading } = useEmitterSubscriptions();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const loadRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setReadIds(new Set());
      return;
    }
    setUserId(user.id);
    const { data } = await supabase
      .from("notifications_read")
      .select("news_id")
      .eq("user_id", user.id);
    setReadIds(new Set((data ?? []).map((r: any) => r.news_id)));
  }, []);

  useEffect(() => {
    loadRead();
  }, [loadRead]);

  // Уведомления = новости по подпискам, новейшие сверху, лимит 30
  const notifications: NotificationItem[] = news
    .filter((n) => subscriptions.includes(n.ticker))
    .slice(0, 30)
    .map((n) => ({ ...n, isRead: readIds.has(n.id) }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(async (newsId: string) => {
    if (!userId) return;
    if (readIds.has(newsId)) return;
    setReadIds((prev) => new Set(prev).add(newsId));
    await supabase
      .from("notifications_read")
      .insert({ user_id: userId, news_id: newsId });
  }, [userId, readIds]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const unread = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unread.length === 0) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      unread.forEach((id) => next.add(id));
      return next;
    });
    await supabase
      .from("notifications_read")
      .insert(unread.map((news_id) => ({ user_id: userId, news_id })));
  }, [userId, notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading: newsLoading || subsLoading,
  };
}
