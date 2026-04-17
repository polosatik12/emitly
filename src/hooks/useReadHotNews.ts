import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabaseProxy";

const KEY_PREFIX = "hot_news_read_v2:";
const GUEST_KEY = `${KEY_PREFIX}guest`;

// Текущий ключ зависит от user_id. До инициализации сессии используем guest.
let currentKey = GUEST_KEY;

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

// Глобальный store: одно состояние на всё приложение,
// чтобы изменения мгновенно видели все компоненты-подписчики.
let currentSet: Set<string> = readSet(currentKey);
const listeners = new Set<() => void>();

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

function setUserKey(userId: string | null) {
  const newKey = userId ? `${KEY_PREFIX}${userId}` : GUEST_KEY;
  if (newKey === currentKey) return;
  currentKey = newKey;
  currentSet = readSet(currentKey);
  emit();
}

// Синхронизация между вкладками
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === currentKey) {
      currentSet = readSet(currentKey);
      emit();
    }
  });

  // Подписка на изменения сессии Supabase: переключаем хранилище под user_id
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUserKey(session?.user?.id ?? null);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    setUserKey(session?.user?.id ?? null);
  });
}

/**
 * Локальное хранилище ID прочитанных «горячих» новостей,
 * изолированное по user_id (для гостей — отдельный список).
 * Это исключает «наследование» прочитанных новостей при регистрации
 * нового аккаунта в том же браузере.
 */
export function useReadHotNews() {
  const set = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const markRead = useCallback((newsId: string) => {
    if (currentSet.has(newsId)) return;
    const next = new Set(currentSet);
    next.add(newsId);
    currentSet = next;
    writeSet(currentKey, next);
    emit();
  }, []);

  const isRead = useCallback((newsId: string) => set.has(newsId), [set]);

  return { isRead, markRead };
}
