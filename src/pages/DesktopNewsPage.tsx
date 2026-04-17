import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import React from "react";
import { Search, SlidersHorizontal, Clock, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { FiltersModal } from "@/components/FiltersModal";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { GreenlandCircle } from "@/components/GreenlandCircle";
import { HotNewsCircle } from "@/components/HotNewsCircle";
import { useNews, type NewsItem } from "@/hooks/useNews";
import { useHotNews } from "@/hooks/useHotNews";
import { useReadHotNews } from "@/hooks/useReadHotNews";
import { useEmitterSubscriptions } from "@/hooks/useEmitterSubscriptions";
import { getEmitterByTicker } from "@/data/emitters";
import { useNavigate } from "react-router-dom";

import logoSber from "@/assets/logo-sber.jpg";
import logoSmlt from "@/assets/logo-smlt.png";
import logoPosi from "@/assets/logo-posi.png";
import logoGazp from "@/assets/logo-gazp.png";
import logoLkoh from "@/assets/logo-lkoh.png";

const categories = ["Все", "Отчётность", "Дивиденды", "Регуляторика", "Сделки"];

const categoryMap: Record<string, string> = {
  "Отчётность": "Отчёты",
  "Дивиденды": "Дивиденды",
  "Регуляторика": "Событие",
  "Сделки": "Сделка",
};

const categoryBottomColors: Record<string, string> = {
  "Событие": "#00B856",
  "Сделка": "#E67E22",
  "Собрание": "#E74C3C",
  "Дивиденды": "#00B856",
  "Отчёты": "#3498DB",
};

const tickerLogos: Record<string, string> = {
  "SBER": logoSber,
  "SMLT": logoSmlt,
  "POSI": logoPosi,
  "GAZP": logoGazp,
  "LKOH": logoLkoh,
};

// NewsItem type imported from useNews

/* ── Hero card (first news, large) ── */
const HeroCard = React.memo(function HeroCard({ news, onClick, read = false }: { news: NewsItem; onClick: () => void; read?: boolean }) {
  const logo = tickerLogos[news.ticker];
  const bottomColor = categoryBottomColors[news.category] || "#BDC3C7";

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-[2px] transition-all duration-200 group ${read ? "opacity-60" : ""}`}
    >
      {/* Gradient accent top */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${bottomColor}, ${bottomColor}88)` }} />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {logo ? (
              <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                <img src={logo} alt={news.ticker} className="w-7 h-7 object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted-foreground flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">{news.ticker.slice(0, 2)}</span>
              </div>
            )}
            <span className="font-extrabold text-lg tracking-wide text-foreground">{news.ticker}</span>
            <CategoryBadge category={news.category} />
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span className="text-xs">{news.date}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground leading-snug mb-4 group-hover:text-primary transition-colors">
          {news.title}
        </h2>

        {/* Sentiment bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[hsl(var(--news-positive))]" strokeWidth={2.2} />
            <span className="text-xs font-semibold text-[hsl(var(--news-positive))]">{news.bullPercent}%</span>
          </div>
          <div className="w-16 h-2 rounded-full overflow-hidden flex">
            <div className="h-full bg-[hsl(var(--news-positive))] rounded-l-full" style={{ width: `${news.bullPercent}%` }} />
            <div className="h-full bg-[hsl(var(--news-negative))] rounded-r-full" style={{ width: `${news.bearPercent}%` }} />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[hsl(var(--news-negative))]">{news.bearPercent}%</span>
            <TrendingDown className="w-3 h-3 text-[hsl(var(--news-negative))]" strokeWidth={2.2} />
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-1 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
});

/* ── Small card (grid items) ── */
const SmallCard = React.memo(function SmallCard({ news, onClick, read = false }: { news: NewsItem; onClick: () => void; read?: boolean }) {
  const logo = tickerLogos[news.ticker];
  const bottomColor = categoryBottomColors[news.category] || "#BDC3C7";

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 group flex flex-col ${read ? "opacity-60" : ""}`}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: bottomColor }} />
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {logo ? (
              <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                <img src={logo} alt={news.ticker} className="w-5 h-5 object-contain" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted-foreground flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary-foreground">{news.ticker.slice(0, 2)}</span>
              </div>
            )}
            <span className="font-extrabold text-sm text-foreground">{news.ticker}</span>
            <CategoryBadge category={news.category} />
          </div>
        </div>

        {/* Title */}
        <p className="text-sm text-foreground leading-snug mb-3 flex-1 group-hover:text-primary transition-colors">
          {news.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-[2px]">
              <TrendingUp className="w-2.5 h-2.5 text-[hsl(var(--news-positive))]" strokeWidth={2.2} />
              <span className="text-[10px] font-semibold text-[hsl(var(--news-positive))]">{news.bullPercent}%</span>
            </div>
            <div className="w-8 h-1.5 rounded-full overflow-hidden flex">
              <div className="h-full bg-[hsl(var(--news-positive))] rounded-l-full" style={{ width: `${news.bullPercent}%` }} />
              <div className="h-full bg-[hsl(var(--news-negative))] rounded-r-full" style={{ width: `${news.bearPercent}%` }} />
            </div>
            <div className="flex items-center gap-[2px]">
              <span className="text-[10px] font-semibold text-[hsl(var(--news-negative))]">{news.bearPercent}%</span>
              <TrendingDown className="w-2.5 h-2.5 text-[hsl(var(--news-negative))]" strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" strokeWidth={1.8} />
            <span className="text-[10px]">{news.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function DesktopNewsPage() {
  const { news: allNews } = useNews();
  const hot = useHotNews(allNews);
  const { subscriptions } = useEmitterSubscriptions();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const filteredNews = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return allNews.filter((n) => {
      if (activeCategory !== "Все") {
        const mapped = categoryMap[activeCategory];
        if (mapped && n.category !== mapped) return false;
      }
      if (q) {
        return n.title.toLowerCase().includes(q) || n.ticker.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allNews, debouncedQuery, activeCategory]);

  const heroNews = filteredNews[0] ?? null;
  const gridNews = filteredNews.slice(1);

  const { markRead, isRead } = useReadHotNews();
  const handleSelectNews = useCallback((news: NewsItem) => { markRead(news.id); setSelectedNews(news); }, [markRead]);
  const handleCloseNews = useCallback(() => setSelectedNews(null), []);
  const handleOpenFilters = useCallback(() => setFiltersOpen(true), []);
  const handleCloseFilters = useCallback(() => setFiltersOpen(false), []);

  return (
    <div className="max-w-[860px] mx-auto py-6 px-6">
      <h1 className="text-2xl font-bold text-foreground mb-5">Главная</h1>

      {/* Special topic + hot news circles */}
      <div className="flex items-center gap-3 mb-5 overflow-x-auto scrollbar-hide pb-1">
        <GreenlandCircle size="md" />
        {hot.map((item) => (
          <HotNewsCircle
            key={item.news.id}
            item={item}
            size="md"
            onClick={() => handleSelectNews(item.news)}
          />
        ))}
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск компаний и новостей"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <button
          onClick={handleOpenFilters}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-foreground border border-border rounded-xl bg-card hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
          Фильтры
        </button>
      </div>

      {/* Подписанные эмитенты — кружки под поиском */}
      {subscriptions.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {subscriptions.map((ticker) => {
            const emitter = getEmitterByTicker(ticker);
            if (!emitter) return null;
            return (
              <button
                key={ticker}
                onClick={() => navigate(`/emitter/${ticker}`)}
                className="flex flex-col items-center gap-1 shrink-0 hover:scale-105 transition-transform"
                aria-label={emitter.name}
              >
                <div className="w-[44px] h-[44px] rounded-full p-[2px] bg-gradient-to-br from-primary via-primary/60 to-accent">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background">
                    <img src={emitter.logo} alt={emitter.name} className="w-[28px] h-[28px] object-contain rounded-full" />
                  </div>
                </div>
                <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[60px]">{emitter.ticker}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hero card */}
      {heroNews && (
        <div className="mb-5">
          <HeroCard news={heroNews} read={isRead(heroNews.id)} onClick={() => handleSelectNews(heroNews)} />
        </div>
      )}

      {/* Grid of smaller cards */}
      {gridNews.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {gridNews.map((news) => (
            <SmallCard key={news.id} news={news} read={isRead(news.id)} onClick={() => handleSelectNews(news)} />
          ))}
        </div>
      )}

      <FiltersModal open={filtersOpen} onClose={handleCloseFilters} />
      <NewsDetailDrawer open={!!selectedNews} onClose={handleCloseNews} news={selectedNews} />
    </div>
  );
}
