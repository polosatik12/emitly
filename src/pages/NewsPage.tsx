import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Menu } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { FiltersModal } from "@/components/FiltersModal";
import { CompanyFilterModal } from "@/components/CompanyFilterModal";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useNews, type NewsItem } from "@/hooks/useNews";

export default function NewsPage() {
  const { news: allNews, loading: newsLoading } = useNews();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [companyFilterOpen, setCompanyFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
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
    <div className="flex flex-col min-h-screen max-w-lg mx-auto pb-[60px] bg-background">
      {/* Header — Emitly */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <button onClick={() => navigate("/profile")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-border overflow-hidden active:scale-95 transition-transform">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] font-bold text-muted-foreground">{initials}</span>
          )}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[18px] tracking-[-0.02em]">
            <span className="font-extrabold text-primary">Emit</span><span className="font-extrabold text-foreground">ly</span>
          </span>
          <button className="p-1" onClick={() => setCompanyFilterOpen(true)}>
            <Menu className="w-[18px] h-[18px] text-foreground" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-2.5">
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

      {/* Filters */}
      <div className="px-4 mb-2.5">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-[7px] text-[13px] font-medium text-foreground border border-border rounded-full bg-card active:scale-[0.93] transition-all duration-200"
        >
          <SlidersHorizontal className="w-[14px] h-[14px]" strokeWidth={2} />
          Фильтры
        </button>
      </div>

      {/* Cards */}
      <div className="px-4 space-y-2.5 flex-1 pb-4">
        {allNews
          .filter((n) =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.ticker.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((news, i) => (
            <div key={i} className="animate-card-enter" style={{ animationDelay: `${i * 50}ms` }}>
              <NewsCard {...news} onClick={() => setSelectedNews(news)} />
            </div>
          ))}
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <CompanyFilterModal open={companyFilterOpen} onClose={() => setCompanyFilterOpen(false)} />
      <NewsDetailDrawer open={!!selectedNews} onClose={() => setSelectedNews(null)} news={selectedNews} />
    </div>
  );
}
