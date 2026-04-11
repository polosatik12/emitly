import { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Send, Image, Video } from "lucide-react";

interface ChatMessage {
  id: number;
  author: string;
  avatar: string;
  avatarColor: string;
  text: string;
  time: string;
  isMe: boolean;
}

const CHAT_STORAGE_KEY = "emitly-chat-messages";
const REMOVED_MESSAGE_TEXT = "саня вафля";

function getTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((item) => item.text.trim().toLowerCase() !== REMOVED_MESSAGE_TEXT);
}

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? sanitizeMessages(parsed) : [];
  } catch {
    return [];
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [message, setMessage] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [nextId, setNextId] = useState(() => {
    const storedMessages = loadStoredMessages();
    const maxId = storedMessages.reduce((currentMax, item) => Math.max(currentMax, item.id), 0);
    return maxId + 1;
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => sanitizeMessages(prev));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sanitizeMessages(messages)));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const text = message.trim();
    if (!text) return;

    const myMsg: ChatMessage = {
      id: nextId,
      author: "Вы",
      avatar: "ВЫ",
      avatarColor: "bg-primary",
      text,
      time: getTimeString(),
      isMe: true,
    };

    setMessages((prev) => [...prev, myMsg]);
    setMessage("");
    setNextId((n) => n + 1);
    setShowAttach(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
        <h1 className="text-[17px] font-bold text-foreground">Общий чат</h1>
        <span className="text-[12px] text-muted-foreground">{messages.length} сообщений</span>
      </div>

      <div className="mx-4 border-b border-dashed border-border" />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-28 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-[56px] h-[56px] rounded-full bg-accent flex items-center justify-center mb-3">
              <Send className="w-[22px] h-[22px] text-primary" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Начните общение</p>
            <p className="text-[13px] text-muted-foreground leading-[1.4]">
              Напишите сообщение, чтобы начать обсуждение с другими участниками
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 items-start mb-3 ${msg.isMe ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-[34px] h-[34px] rounded-full ${msg.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5`}
            >
              {msg.avatar}
            </div>
            <div className={`flex-1 min-w-0 ${msg.isMe ? "flex flex-col items-end" : ""}`}>
              <p className="text-[12.5px] font-medium mb-0.5 text-primary">
                {msg.author}
              </p>
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
        ))}
      </div>

      {/* Input */}
      <div className="fixed bottom-[52px] left-0 right-0 max-w-lg mx-auto bg-muted border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <button
            onClick={() => setShowAttach(!showAttach)}
            className="w-[36px] h-[36px] rounded-full bg-background border border-border flex items-center justify-center shrink-0"
          >
            <Paperclip className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.8} />
          </button>

          {showAttach && (
            <div className="absolute bottom-[50px] left-3 bg-card rounded-[14px] shadow-lg border border-border py-1.5 px-1 animate-slide-up min-w-[130px]">
              <button className="flex items-center gap-2.5 px-3 py-2 text-[13.5px] hover:bg-muted rounded-[10px] w-full transition-colors text-foreground">
                <Image className="w-[16px] h-[16px]" strokeWidth={1.5} />
                Фото
              </button>
              <button className="flex items-center gap-2.5 px-3 py-2 text-[13.5px] hover:bg-muted rounded-[10px] w-full transition-colors text-foreground">
                <Video className="w-[16px] h-[16px]" strokeWidth={1.5} />
                Видео
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Сообщение"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3.5 py-[8px] rounded-full bg-background border border-border text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {message.trim() ? (
            <button
              onClick={sendMessage}
              className="w-[36px] h-[36px] rounded-full bg-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <Send className="w-[17px] h-[17px] text-primary-foreground" strokeWidth={2} />
            </button>
          ) : (
            <button className="w-[36px] h-[36px] rounded-full bg-background border border-border flex items-center justify-center shrink-0">
              <Mic className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
