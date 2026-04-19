import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthReady } from "@/hooks/useAuthReady";
import { supabase } from "@/lib/supabaseProxy";

interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  avatarColor: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface ChatMessageRow {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
}

const REMOVED_MESSAGE_TEXT = "саня вафля";
const POLL_INTERVAL_MS = 5000;

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ЕМ";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getAvatarColor(userId: string): string {
  const tones = ["bg-primary", "bg-secondary", "bg-accent", "bg-muted"];
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tones[hash % tones.length] ?? "bg-primary";
}

function sanitizeRows(rows: ChatMessageRow[]): ChatMessageRow[] {
  return rows.filter((item) => item.text.trim().toLowerCase() !== REMOVED_MESSAGE_TEXT);
}

function mapMessages(rows: ChatMessageRow[], profiles: ProfileRow[], currentUserId: string): ChatMessage[] {
  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile.display_name?.trim() || "Пользователь"]));

  return sanitizeRows(rows).map((row) => {
    const isMe = row.user_id === currentUserId;
    const authorName = profileMap.get(row.user_id) || "Пользователь";

    return {
      id: row.id,
      author: isMe ? "Вы" : authorName,
      avatar: getInitials(isMe ? "Вы" : authorName),
      avatarColor: getAvatarColor(row.user_id),
      text: row.text,
      time: formatMessageTime(row.created_at),
      isMe,
    };
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-[56px] h-[56px] rounded-full bg-accent flex items-center justify-center mb-3">
        <Send className="w-[22px] h-[22px] text-primary" />
      </div>
      <p className="text-[15px] font-semibold text-foreground mb-1">Начните общение</p>
      <p className="text-[13px] text-muted-foreground leading-[1.4] max-w-md">
        Напишите сообщение, чтобы начать обсуждение с другими участниками
      </p>
    </div>
  );
}

function AuthRequiredState({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-[56px] h-[56px] rounded-full bg-accent flex items-center justify-center mb-3">
        <Users className="w-[22px] h-[22px] text-primary" />
      </div>
      <p className="text-[15px] font-semibold text-foreground mb-1">Войдите в чат</p>
      <p className="text-[13px] text-muted-foreground leading-[1.4] max-w-md mb-4">
        Общий чат теперь сохраняет сообщения в аккаунте, поэтому для отправки и просмотра нужна авторизация
      </p>
      <button
        onClick={onLogin}
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
      >
        Перейти ко входу
      </button>
    </div>
  );
}

export default function ChatPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user, isAuthReady } = useAuthReady();

  const loadMessages = useCallback(async (currentUserId: string) => {
    const chatClient = supabase as any;

    const { data, error } = await chatClient
      .from("chat_messages")
      .select("id, user_id, text, created_at")
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw error;

    const rows = (data || []) as ChatMessageRow[];
    const userIds = [...new Set(rows.map((row) => row.user_id))];

    let profiles: ProfileRow[] = [];

    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      if (profileError) throw profileError;
      profiles = (profileRows || []) as ProfileRow[];
    }

    setMessages(mapMessages(rows, profiles, currentUserId));
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(true);
      return;
    }

    if (!user?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const initializeChat = async () => {
      setLoading(true);
      try {
        await loadMessages(user.id);
      } catch (error) {
        console.error("Failed to load chat:", error);
        toast.error("Не удалось загрузить сообщения");
      } finally {
        setLoading(false);
      }
    };

    void initializeChat();
  }, [isAuthReady, loadMessages, user?.id]);

  useEffect(() => {
    if (!isAuthReady || !user?.id) return;

    const chatClient = supabase as any;
    const refreshMessages = async () => {
      try {
        await loadMessages(user.id);
      } catch (error) {
        console.error("Failed to refresh chat messages:", error);
      }
    };

    const channel = chatClient
      .channel("public-chat-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
        },
        () => {
          void refreshMessages();
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      void refreshMessages();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      chatClient.removeChannel(channel);
    };
  }, [isAuthReady, loadMessages, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || !user?.id || sending) return;

    setSending(true);

    try {
      const chatClient = supabase as any;
      const { error } = await chatClient.from("chat_messages").insert({
        user_id: user.id,
        text,
      });

      if (error) throw error;

      setMessage("");
      await loadMessages(user.id);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  }, [loadMessages, message, sending, user?.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  const hasMessages = messages.length > 0;
  const isReadyToSend = Boolean(message.trim()) && Boolean(user?.id) && !sending;

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen max-w-lg md:max-w-3xl mx-auto bg-background">
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
          <h1 className="text-[17px] font-bold text-foreground">Общий чат</h1>
          <span className="text-[12px] text-muted-foreground">{messages.length} сообщений</span>
        </div>
        <div className="mx-4 border-b border-dashed border-border" />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-28 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Загрузка сообщений...
            </div>
          ) : !user ? (
            <AuthRequiredState onLogin={handleLogin} />
          ) : !hasMessages ? (
            <EmptyState />
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 items-start mb-3 ${msg.isMe ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-[34px] h-[34px] rounded-full ${msg.avatarColor} flex items-center justify-center text-[11px] font-bold text-foreground shrink-0 mt-0.5`}
                >
                  {msg.avatar}
                </div>
                <div className={`flex-1 min-w-0 ${msg.isMe ? "flex flex-col items-end" : ""}`}>
                  <p className="text-[12.5px] font-medium mb-0.5 text-primary">{msg.author}</p>
                  <div
                    className={`px-3 py-2 inline-block max-w-[82%] ${
                      msg.isMe
                        ? "bg-primary rounded-[16px] rounded-tr-[6px] text-primary-foreground"
                        : "bg-muted rounded-[16px] rounded-tl-[6px]"
                    }`}
                  >
                    <p className={`text-[13.5px] leading-[1.38] ${msg.isMe ? "text-primary-foreground" : "text-foreground"}`}>
                      {msg.text}
                    </p>
                  </div>
                  <p className={`text-[10.5px] text-muted-foreground mt-0.5 ${msg.isMe ? "text-right" : ""}`}>{msg.time}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="fixed bottom-[52px] left-0 right-0 max-w-lg md:max-w-3xl mx-auto bg-muted border-t border-border">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <input
              type="text"
              placeholder={user ? "Сообщение" : "Войдите, чтобы писать в чат"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!user}
              className="flex-1 px-3.5 py-[8px] rounded-full bg-background border border-border text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />

            <button
              onClick={() => (user ? void sendMessage() : handleLogin())}
              disabled={user ? !isReadyToSend : false}
              className="w-[36px] h-[36px] rounded-full bg-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Send className="w-[17px] h-[17px] text-primary-foreground" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-bold text-foreground">Общий чат</h1>
            <span className="text-[13px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              {messages.length} сообщений
            </span>
          </div>
          <button className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Users className="w-4 h-4" />
            Участники
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Загрузка сообщений...
            </div>
          ) : !user ? (
            <AuthRequiredState onLogin={handleLogin} />
          ) : !hasMessages ? (
            <EmptyState />
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 items-start ${msg.isMe ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-[38px] h-[38px] rounded-full ${msg.avatarColor} flex items-center justify-center text-[12px] font-bold text-foreground shrink-0 mt-0.5`}
                  >
                    {msg.avatar}
                  </div>
                  <div className={`min-w-0 max-w-[60%] ${msg.isMe ? "flex flex-col items-end" : ""}`}>
                    <p className="text-[13px] font-medium mb-0.5 text-primary">{msg.author}</p>
                    <div
                      className={`px-4 py-2.5 inline-block ${
                        msg.isMe
                          ? "bg-primary rounded-[18px] rounded-tr-[6px] text-primary-foreground"
                          : "bg-muted rounded-[18px] rounded-tl-[6px]"
                      }`}
                    >
                      <p className={`text-[14px] leading-[1.45] ${msg.isMe ? "text-primary-foreground" : "text-foreground"}`}>
                        {msg.text}
                      </p>
                    </div>
                    <p className={`text-[11px] text-muted-foreground mt-1 ${msg.isMe ? "text-right" : ""}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card px-6 py-3 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <input
              type="text"
              placeholder={user ? "Напишите сообщение..." : "Войдите, чтобы писать в чат"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!user}
              className="flex-1 px-4 py-[10px] rounded-xl bg-muted border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-60"
            />

            <button
              onClick={() => (user ? void sendMessage() : handleLogin())}
              disabled={user ? !isReadyToSend : false}
              className="w-[40px] h-[40px] rounded-full bg-primary flex items-center justify-center shrink-0 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-[18px] h-[18px] text-primary-foreground" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
