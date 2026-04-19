import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Menu } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { FiltersModal, DEFAULT_FILTERS, type FilterState } from "@/components/FiltersModal";
import { applyNewsFilters, activeFiltersCount } from "@/lib/newsFilters";
import { CompanyFilterModal } from "@/components/CompanyFilterModal";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { supabase } from "@/lib/supabaseProxy";
import { useNews, type NewsItem } from "@/hooks/useNews";
import { useEmitterSubscriptions } from "@/hooks/useEmitterSubscriptions";
import { SubscribedEmittersStrip } from "@/components/SubscribedEmittersStrip";
import { usePlan } from "@/hooks/usePlan";
import { useReadHotNews } from "@/hooks/useReadHotNews";
import { getEmitterByTicker } from "@/data/emitters";


export default function NewsPage() {
  const { news: allNews, loading: newsLoading } = useNews();
  const { subscriptions } = useEmitterSubscriptions();
  const { isSourceAllowed } = usePlan();
  const { markRead, isRead } = useReadHotNews();
  const navigate = useNavigate();
  const openNews = (n: NewsItem) => { markRead(n.id); setSelectedNews(n); };
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [companyFilterOpen, setCompanyFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
      const parts = name.split(/\s+/).filter(Boolean);
      const ini = parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : (parts[0]?.slice(0, 2) ?? "U").toUpperCase();

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;
      const avatar = profile?.avatar_url || (typeof meta.avatar_url === "string" ? meta.avatar_url : null);
      setAvatarUrl(avatar || null);
      const dn = profile?.display_name?.trim() || name;
      const p2 = dn.split(/\s+/).filter(Boolean);
      setInitials(
        p2.length >= 2
          ? `${p2[0][0]}${p2[1][0]}`.toUpperCase()
          : (p2[0]?.slice(0, 2) ?? "U").toUpperCase()
      );
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen max-w-lg md:max-w-3xl mx-auto pb-[60px] bg-background">
      {/* Header — Emitly с встроенным strip кружков */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
        <button onClick={() => navigate("/profile")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-border overflow-hidden active:scale-95 transition-transform">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] font-bold text-muted-foreground">{initials}</span>
          )}
        </button>

        {/* Strip кружков занимает всё свободное место между аватаром и логотипом */}
        <div className="flex-1 min-w-0">
          <SubscribedEmittersStrip tickers={[]} onSelectNews={openNews} compact />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[18px] tracking-[-0.02em]">
            <span className="font-extrabold text-primary">Emit</span><span className="font-extrabold text-foreground">ly</span>
          </span>
          <button className="p-1" onClick={() => setCompanyFilterOpen(true)}>
            <Menu className="w-[18px] h-[18px] text-foreground" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-2.5 mt-1">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск компаний и новостей"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-[10px] rounded-[14px] border border-border bg-card text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {/* Подписанные эмитенты — кружки под поиском */}
      {subscriptions.length > 0 && (
        <div className="px-4 mb-2.5">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {subscriptions.map((ticker) => {
              const emitter = getEmitterByTicker(ticker);
              if (!emitter) return null;
              return (
                <button
                  key={ticker}
                  onClick={() => navigate(`/emitter/${ticker}`)}
                  className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
                  aria-label={emitter.name}
                >
                  <div className="w-[44px] h-[44px] rounded-full p-[2px] bg-gradient-to-br from-primary via-primary/60 to-accent">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background">
                      <img
                        src={emitter.logo}
                        alt={emitter.name}
                        className="w-[28px] h-[28px] object-contain rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[60px]">
                    {emitter.ticker}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scope chips + Filters */}
      <div className="px-4 mb-2.5 flex items-center gap-2">
        <button
          onClick={() => setScope("all")}
          className={`px-3.5 py-[7px] text-[13px] font-medium rounded-full border transition-all duration-200 active:scale-[0.93] ${
            scope === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setScope("mine")}
          className={`px-3.5 py-[7px] text-[13px] font-medium rounded-full border transition-all duration-200 active:scale-[0.93] ${
            scope === "mine"
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          Мои
        </button>
        <button
          onClick={() => setFiltersOpen(true)}
          className="ml-auto flex items-center gap-1.5 px-3.5 py-[7px] text-[13px] font-medium text-foreground border border-border rounded-full bg-card active:scale-[0.93] transition-all duration-200"
        >
          <SlidersHorizontal className="w-[14px] h-[14px]" strokeWidth={2} />
          Фильтры
          {activeFiltersCount(filters) > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
              {activeFiltersCount(filters)}
            </span>
          )}
        </button>
      </div>



      {/* Cards */}
      <div className="px-4 space-y-2.5 flex-1 pb-4">
        {scope === "mine" && subscriptions.length === 0 && (
          <div className="text-center text-muted-foreground text-[13px] py-8">
            Вы ещё не подписаны ни на одного эмитента.<br />
            Откройте профиль компании и нажмите «Подписаться».
          </div>
        )}
        {applyNewsFilters(allNews, filters)
          .filter((n) => scope === "all" || subscriptions.includes(n.ticker))
          .filter((n) => !activeTrigger || (n.triggerCategories || []).includes(activeTrigger))
          .filter((n) =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.ticker.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((news, i) => {
            const src = (news as any).source as string | undefined;
            const locked = !isSourceAllowed(src);
            return (
              <div key={i} className="animate-card-enter" style={{ animationDelay: `${i * 50}ms` }}>
                <NewsCard
                  {...news}
                  source={src}
                  locked={locked}
                  read={isRead(news.id)}
                  onClick={() => !locked && openNews(news)}
                />
              </div>
            );
          })}
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onApply={setFilters}
      />
      <CompanyFilterModal open={companyFilterOpen} onClose={() => setCompanyFilterOpen(false)} />
      <NewsDetailDrawer open={!!selectedNews} onClose={() => setSelectedNews(null)} news={selectedNews} />
    </div>
  );
}
