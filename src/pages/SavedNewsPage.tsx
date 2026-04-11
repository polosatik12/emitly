import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mockNews } from "@/pages/NewsPage";
import { NewsCard } from "@/components/NewsCard";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";

export default function SavedNewsPage() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<typeof mockNews[0] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) { setLoading(false); return; }
      const { data } = await supabase
        .from("news_bookmarks")
        .select("news_id")
        .eq("user_id", user.id);
      if (mounted) {
        setBookmarkedIds((data || []).map((b) => b.news_id));
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const savedNews = mockNews.filter((n) => bookmarkedIds.includes(n.id));

  const removeBookmark = async (newsId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("news_bookmarks").delete().eq("news_id", newsId).eq("user_id", user.id);
    setBookmarkedIds((prev) => prev.filter((id) => id !== newsId));
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Link to="/profile" className="p-2 -m-1 active:scale-95 transition-transform z-10">
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
        </Link>
        <h1 className="text-[17px] font-bold text-foreground flex-1">Сохранённые новости</h1>
        <span className="text-[14px] text-muted-foreground">{savedNews.length} статей</span>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : savedNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 px-8 -mt-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-5">
            <Bookmark className="h-7 w-7 text-muted-foreground" strokeWidth={1.6} />
          </div>
          <p className="text-[17px] font-semibold text-foreground mb-2">Нет сохранённых новостей</p>
          <p className="text-[14px] text-muted-foreground text-center leading-snug">
            Нажмите на закладку в карточке новости, чтобы сохранить её для чтения позже
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-2.5 flex-1 pb-4 pt-2">
          {savedNews.map((news) => (
            <div key={news.id} className="relative">
              <NewsCard {...news} onClick={() => setSelectedNews(news)} />
              <button
                onClick={(e) => { e.stopPropagation(); removeBookmark(news.id); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border active:scale-90 transition-transform"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <NewsDetailDrawer open={!!selectedNews} onClose={() => setSelectedNews(null)} news={selectedNews} />
    </div>
  );
}
