import { useState, useEffect } from "react";
import { ArrowLeft, Share2, CalendarDays, ExternalLink, TrendingUp, TrendingDown, Bookmark, BookmarkCheck, Bell, Heart, MessageCircle, Users, LogIn, X, Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNewsComments, useNewsBookmark, useNewsVotes } from "@/hooks/useNewsInteractions";
import { supabase } from "@/integrations/supabase/client";
import logoSber from "@/assets/logo-sber.jpg";
import logoSmlt from "@/assets/logo-smlt.png";
import logoPosi from "@/assets/logo-posi.png";
import logoGazp from "@/assets/logo-gazp.png";
import logoLkoh from "@/assets/logo-lkoh.png";

const tickerLogos: Record<string, string> = {
  SBER: logoSber, SMLT: logoSmlt, POSI: logoPosi, GAZP: logoGazp, LKOH: logoLkoh,
};

const avatarColors = [
  "hsl(216 50% 42%)", "hsl(262 40% 48%)", "hsl(0 65% 45%)",
  "hsl(193 55% 38%)", "hsl(28 70% 45%)", "hsl(142 50% 36%)",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatCommentDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

interface NewsDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  news: {
    id: string;
    ticker: string;
    companyName: string;
    sector: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    category: string;
    title: string;
    fullDate: string;
    bodyText: string;
    bullPercent: number;
    bearPercent: number;
    comments: number;
    commentsList?: { name: string; date: string; text: string; likes: number }[];
  } | null;
}

export default function NewsDetailDrawer({ open, onClose, news }: NewsDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const newsId = news?.id || null;
  const { comments: dbComments, addComment } = useNewsComments(open ? newsId : null);
  const { isBookmarked, toggleBookmark } = useNewsBookmark(open ? newsId : null);
  const { userVote, vote, bullPercent, bearPercent, totalVotes } = useNewsVotes(open ? newsId : null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ? { id: u.id } : null));
  }, [open]);

  if (!news) return null;

  const logo = tickerLogos[news.ticker];
  const isPositive = news.priceChangePercent >= 0;

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const ok = await addComment(commentText.trim());
    if (ok) setCommentText("");
    setSubmitting(false);
  };

  // Merge mock comments with DB comments
  const allComments = [
    ...(news.commentsList || []).map((c, i) => ({
      key: `mock-${i}`,
      name: c.name,
      date: c.date,
      text: c.text,
      likes: c.likes,
    })),
    ...dbComments.map((c) => ({
      key: c.id,
      name: c.display_name,
      date: formatCommentDate(c.created_at),
      text: c.text,
      likes: c.likes,
    })),
  ];

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-2">
        <button onClick={onClose} className="p-1 active:scale-95 transition-transform">
          {isMobile ? <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} /> : <X className="h-5 w-5 text-foreground" strokeWidth={2} />}
        </button>
        <button className="p-1 active:scale-95 transition-transform">
          <Share2 className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
        </button>
      </div>

      {/* Company info */}
      <div className="px-4 pt-2 pb-0">
        <div className="flex items-center gap-3">
          {logo && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-card">
              <img src={logo} alt={news.ticker} className="h-[52px] w-[52px] object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-bold leading-tight text-foreground">{news.companyName}</div>
            <div className="mt-1 text-[12px] leading-none text-muted-foreground">{news.ticker} · {news.sector}</div>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-bold leading-tight text-foreground">{news.price} ₽</div>
            <div className={`mt-1 text-[12.5px] font-semibold leading-none ${isPositive ? "text-[hsl(var(--news-positive))]" : "text-[hsl(var(--news-negative))]"}`}>
              {isPositive ? "+" : ""}{news.priceChangePercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 px-4 pt-5 pb-0">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--news-blue-soft))] px-3 py-[6px] text-[12px] font-medium leading-none text-[hsl(var(--news-blue))]">
          <span className="text-[12px] leading-none opacity-70">▦</span>
          Корпоративные события
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">PRO</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--news-positive-soft-border))] bg-[hsl(var(--news-positive-soft))] px-3 py-[6px] text-[12px] font-medium leading-none text-[hsl(var(--news-positive))]">
          <TrendingUp className="h-3 w-3" strokeWidth={2.2} />
          Позитивно
        </span>
      </div>

      {/* Title */}
      <div className="px-4 pt-5 pb-0">
        <h1 className="text-[20px] font-bold leading-[1.3] text-foreground">{news.title}</h1>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-0">
        <CalendarDays className="h-[14px] w-[14px] text-muted-foreground" strokeWidth={1.8} />
        <span className="text-[12px] text-muted-foreground">{news.fullDate}</span>
      </div>

      {/* Open original */}
      <div className="px-4 pt-4 pb-0">
        <button className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[hsl(var(--news-positive-soft))] px-4 text-[13px] font-medium text-[hsl(var(--news-positive))] active:scale-95 transition-transform">
          <ExternalLink className="h-[13px] w-[13px]" strokeWidth={2} />
          Открыть оригинал
        </button>
      </div>

      <div className="px-4 pt-5"><div className="h-px w-full bg-[hsl(var(--border))]" /></div>

      {/* Body */}
      <div className="px-4 pt-5 pb-0">
        <p className="text-[14.5px] leading-[1.7] text-foreground">{news.bodyText}</p>
      </div>

      {/* Voting section */}
      <div className="mx-4 mt-5 rounded-2xl bg-[hsl(var(--news-surface))] p-4">
        <p className="text-center text-[13px] font-medium text-muted-foreground">Как повлияет на акции?</p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => vote("long")}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold active:scale-[0.97] transition-transform ${
              userVote === "long"
                ? "bg-[hsl(var(--news-positive))] text-white"
                : "bg-[hsl(var(--news-positive-soft))] text-[hsl(var(--news-positive))]"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.2} />
            Лонг
          </button>
          <button
            onClick={() => vote("short")}
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-semibold active:scale-[0.97] transition-transform ${
              userVote === "short"
                ? "bg-[hsl(var(--news-negative))] text-white"
                : "bg-[hsl(var(--news-negative-soft))] text-[hsl(var(--news-negative))]"
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.2} />
            Шорт
          </button>
        </div>

        <div className="mt-3.5 h-[6px] w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <div className="h-full rounded-full bg-[hsl(var(--news-positive))]" style={{ width: `${bullPercent}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11.5px] font-semibold">
          <span className="text-[hsl(var(--news-positive))]">{bullPercent}%</span>
          <span className="text-[hsl(var(--news-negative))]">{bearPercent}%</span>
        </div>
        <div className="mt-2.5 flex items-center justify-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" strokeWidth={1.8} />
          <p className="text-[11.5px]">{totalVotes || news.comments} голоса</p>
        </div>
      </div>

      {/* Save / Subscribe */}
      <div className="px-4 pt-5 pb-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={toggleBookmark}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-[13px] font-medium active:scale-[0.97] transition-transform ${
              isBookmarked
                ? "border-[hsl(var(--news-positive))] bg-[hsl(var(--news-positive-soft))] text-[hsl(var(--news-positive))]"
                : "border-[hsl(var(--border))] bg-card text-foreground"
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="h-[14px] w-[14px]" strokeWidth={1.8} /> : <Bookmark className="h-[14px] w-[14px]" strokeWidth={1.8} />}
            {isBookmarked ? "Сохранено" : "Сохранить"}
          </button>
          <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-card text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform">
            <Bell className="h-[14px] w-[14px]" strokeWidth={1.8} />
            Подписаться
          </button>
        </div>
      </div>

      {/* Stock impact */}
      <div className="px-4 pt-5 pb-0">
        <div className="rounded-2xl bg-[hsl(var(--news-surface))] p-4">
          <p className="text-[12px] font-medium text-muted-foreground">Влияние на акции</p>
          <div className="mt-3 flex items-center gap-3">
            {logo && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-card">
                <img src={logo} alt={news.ticker} className="h-10 w-10 object-cover" />
              </div>
            )}
            <span className="text-[16px] font-semibold text-foreground">{news.ticker}</span>
            <span className={`ml-auto inline-flex items-center gap-1 text-[13px] font-semibold ${isPositive ? "text-[hsl(var(--news-positive))]" : "text-[hsl(var(--news-negative))]"}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" strokeWidth={2.2} /> : <TrendingDown className="h-3 w-3" strokeWidth={2.2} />}
              {isPositive ? "+" : ""}{news.priceChange} ₽ ({isPositive ? "+" : ""}{news.priceChangePercent}%)
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5"><div className="h-px w-full bg-[hsl(var(--border))]" /></div>

      {/* Comments */}
      <div className="px-4 pt-5 pb-8">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.8} />
          <p className="text-[15px] font-bold text-foreground">Комментарии ({allComments.length})</p>
        </div>

        {/* Comment input or login prompt */}
        {user ? (
          <div className="mb-5 flex items-center gap-2">
            <input
              type="text"
              placeholder="Написать комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
              className="flex-1 h-10 rounded-[16px] border border-[hsl(var(--border))] bg-card px-4 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 active:scale-95 transition-transform"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="mb-5 flex h-10 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-card text-[13px] text-muted-foreground">
            <LogIn className="h-[14px] w-[14px]" strokeWidth={2} />
            <span>Войдите, чтобы комментировать</span>
          </div>
        )}

        {/* Comment list */}
        <div>
          {allComments.map((comment, i) => (
            <div key={comment.key} className={`${i > 0 ? "border-t border-[hsl(var(--border))] pt-4" : ""} ${i < allComments.length - 1 ? "pb-4" : ""}`}>
              <div className="flex gap-3">
                <div
                  className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: getAvatarColor(comment.name) }}
                >
                  <span className="text-[11px] font-bold uppercase leading-none text-white">{comment.name.slice(0, 2)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="truncate font-semibold text-foreground">{comment.name}</span>
                    <span className="text-muted-foreground">{comment.date}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.5] text-foreground">{comment.text}</p>
                  <div className="mt-2.5 flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-[14px] w-[14px]" strokeWidth={1.7} />
                    {comment.likes > 0 && <span className="text-[12px]">{comment.likes}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={onClose}
        />
        <div
          className={`fixed inset-x-0 bottom-0 z-50 max-h-[93vh] overflow-y-auto rounded-t-[18px] bg-card transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-[5px] w-9 rounded-full bg-[hsl(0_0%_85%)]" />
          </div>
          {content}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-2xl bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    </>
  );
}
