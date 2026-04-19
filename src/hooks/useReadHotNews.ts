import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabaseProxy";

/**
 * Хранилище ID прочитанных «горячих» новостей в БД (таблица user_read_hot_news).
 * - Гости: остаётся локальный fallback в памяти (без localStorage),
 *   чтобы не «наследовать» состояние при логине.
 * - Авторизованные: данные синхронизируются между устройствами через Supabase Realtime.
 */

let currentUserId: string | null = null;
let currentSet: Set<string> = new Set();
const listeners = new Set<() => void>();
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentSet;
}

async function loadFromDb(userId: string) {
  const { data } = await supabase
    .from("user_read_hot_news")
    .select("news_id")
    .eq("user_id", userId);
  currentSet = new Set((data ?? []).map((r: any) => r.news_id));
  emit();
}

function setupRealtime(userId: string) {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  realtimeChannel = supabase
    .channel(`user_read_hot_news:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_read_hot_news",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        if (payload.eventType === "INSERT") {
          const id = payload.new?.news_id;
          if (id && !currentSet.has(id)) {
            const next = new Set(currentSet);
            next.add(id);
            currentSet = next;
            emit();
          }
        } else if (payload.eventType === "DELETE") {
          const id = payload.old?.news_id;
          if (id && currentSet.has(id)) {
            const next = new Set(currentSet);
            next.delete(id);
            currentSet = next;
            emit();
          }
        }
      }
    )
    .subscribe();
}

async function setUser(userId: string | null) {
  if (userId === currentUserId) return;
  currentUserId = userId;
  // Сбрасываем состояние при смене пользователя
  currentSet = new Set();
  emit();
  if (userId) {
    await loadFromDb(userId);
    setupRealtime(userId);
  } else if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user?.id ?? null);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user?.id ?? null);
  });
}

export function useReadHotNews() {
  const set = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const markRead = useCallback(async (newsId: string) => {
    if (currentSet.has(newsId)) return;
    // Optimistic update
    const next = new Set(currentSet);
    next.add(newsId);
    currentSet = next;
    emit();

    if (currentUserId) {
      await supabase
        .from("user_read_hot_news")
        .insert({ user_id: currentUserId, news_id: newsId });
    }
  }, []);

  const isRead = useCallback((newsId: string) => set.has(newsId), [set]);

  return { isRead, markRead };
}
