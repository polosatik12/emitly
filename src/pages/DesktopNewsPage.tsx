import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { FiltersModal } from "@/components/FiltersModal";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { mockNews } from "@/pages/NewsPage";

const categories = ["Все", "Отчётность", "Дивиденды", "Регуляторика", "Сделки"];

export default function DesktopNewsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState<typeof mockNews[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");

  return (
    <div className="max-w-[720px] mx-auto py-6 px-6">
      {/* Title */}
      <h1 className="text-[24px] font-bold text-foreground mb-5">Главная</h1>

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
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск компаний и новостей"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-foreground border border-border rounded-xl bg-card hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
          Фильтры
        </button>
      </div>

      {/* News cards */}
      <div className="space-y-3">
        {mockNews
          .filter((n) =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.ticker.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((news, i) => (
            <NewsCard key={i} {...news} onClick={() => setSelectedNews(news)} />
          ))}
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <NewsDetailDrawer open={!!selectedNews} onClose={() => setSelectedNews(null)} news={selectedNews} />
    </div>
  );
}
