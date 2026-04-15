import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, BellOff, Bell } from "lucide-react";
import { getEmitterByTicker } from "@/data/emitters";
import { useNews, type NewsItem } from "@/hooks/useNews";
import { NewsCard } from "@/components/NewsCard";
import { FiltersModal } from "@/components/FiltersModal";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { useEmitterSubscriptions } from "@/hooks/useEmitterSubscriptions";
import { useMoexPrices, formatPrice } from "@/hooks/useMoexPrices";

const categories = ["Все", "Событие", "Сделка", "Дивиденды", "Отчёты"];

export default function EmitterProfilePage() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const emitter = getEmitterByTicker(ticker || "");
  const { news: allNews } = useNews();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { isSubscribed, subscribe, unsubscribe } = useEmitterSubscriptions();
  const { prices } = useMoexPrices();

  // Live price from MOEX
  const livePrice = ticker ? prices[ticker.toUpperCase()] : undefined;
  const displayPrice = livePrice ? formatPrice(livePrice.price) : emitter?.price ?? "";
  const displayChangePercent = livePrice ? livePrice.changePercent : (emitter?.changePercent ?? 0);

  // Filter news by this emitter's ticker
  const emitterNews = useMemo(() => {
    if (!ticker) return [];
    return allNews.filter((n) => {
      const matchesTicker = n.ticker === ticker.toUpperCase();
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.ticker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "Все" || n.category === activeCategory;
      return matchesTicker && matchesSearch && matchesCategory;
    });
  }, [ticker, searchQuery, activeCategory, allNews]);

  // Generate mock chart data points
  const chartPoints = useMemo(() => {
    const basePrice = livePrice ? livePrice.price : (emitter ? parseFloat(emitter.price.replace(/[^\d.]/g, "")) || 100 : 100);
    const points = [];
    let price = basePrice;
    for (let i = 0; i < 60; i++) {
      price = price * (1 + (Math.random() - 0.48) * 0.02);
    points.push(price);
    }
    return points;
  }, [livePrice?.price, emitter?.price]);

  const minP = Math.min(...chartPoints);
  const maxP = Math.max(...chartPoints);
  const range = maxP - minP || 1;
  const chartH = 120;
  const chartW = 320;

  const pathD = chartPoints
    .map((p, i) => {
      const x = (i / (chartPoints.length - 1)) * chartW;
      const y = chartH - ((p - minP) / range) * (chartH - 10);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isPositive = displayChangePercent >= 0;
  const strokeColor = isPositive ? "hsl(var(--news-positive))" : "hsl(var(--news-negative))";

  if (!emitter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-foreground text-lg font-semibold mb-2">Эмитент не найден</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm">Назад</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen max-w-3xl mx-auto pb-[60px] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <img src={emitter.logo} alt={emitter.ticker} className="w-9 h-9 rounded-full object-cover border border-border" />
          <div>
            <p className="text-[16px] font-bold text-foreground leading-tight">{emitter.name}</p>
            <p className="text-[12px] text-muted-foreground">{emitter.ticker}</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (ticker) {
              isSubscribed(ticker.toUpperCase()) ? unsubscribe(ticker.toUpperCase()) : subscribe(ticker.toUpperCase());
            }
          }}
          className="p-1.5"
        >
          {ticker && isSubscribed(ticker.toUpperCase()) ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Analytics metrics */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
        {[
          { label: "P/E", value: emitter.analytics.pe },
          { label: "P/B", value: emitter.analytics.pb },
          { label: "EV/EBITDA", value: emitter.analytics.evEbitda },
          { label: "ND/EBITDA", value: emitter.analytics.ndEbitda },
        ].map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border shrink-0"
          >
            <span className="text-[12px] text-muted-foreground">{m.label}</span>
            <span className="text-[13px] font-bold text-foreground">{m.value}</span>
          </div>
        ))}
      </div>

      {/* Price + chart */}
      <div className="px-4 py-3">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[22px] font-bold text-foreground">{displayPrice}</span>
          <span className={`text-[14px] font-semibold ${isPositive ? "text-[hsl(var(--news-positive))]" : "text-[hsl(var(--news-negative))]"}`}>
            {isPositive ? "+" : ""}{displayChangePercent.toFixed(2)}%
          </span>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 overflow-hidden">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-[120px]" preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d={`${pathD} L${chartW},${chartH} L0,${chartH} Z`}
              fill={isPositive ? "hsl(var(--news-positive) / 0.08)" : "hsl(var(--news-negative) / 0.08)"}
            />
          </svg>
        </div>
      </div>

      {/* News section */}
      <div className="px-4 mt-2">
        <h2 className="text-[16px] font-bold text-foreground mb-3">Новости</h2>

        {/* Category pills */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors shrink-0 ${
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
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск новостей"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-[9px] rounded-xl border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1.5 px-3 py-[9px] text-[12px] font-medium text-foreground border border-border rounded-xl bg-card"
          >
            <SlidersHorizontal className="w-[14px] h-[14px]" strokeWidth={2} />
            Фильтры
          </button>
        </div>

        {/* News list */}
        <div className="space-y-2.5 pb-4">
          {emitterNews.length > 0 ? (
            emitterNews.map((news, i) => (
              <NewsCard key={i} {...news} onClick={() => setSelectedNews(news)} />
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-[14px]">Нет новостей по данному эмитенту</p>
            </div>
          )}
        </div>
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <NewsDetailDrawer open={!!selectedNews} onClose={() => setSelectedNews(null)} news={selectedNews} />
    </div>
  );
}
