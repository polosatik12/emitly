import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, RefreshCw } from "lucide-react";
import { useTriggerCategories } from "@/hooks/useTriggerCategories";

interface RawNews {
  id: string;
  source_slug: string | null;
  source_name: string | null;
  source_url: string | null;
  title: string;
  body_text: string;
  published_at: string | null;
  trigger_categories: string[];
  matched_keywords: string[];
  is_processed: boolean;
  created_at: string;
}

export default function AdminRawNewsTab() {
  const { categories } = useTriggerCategories();
  const [items, setItems] = useState<RawNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("raw_news" as any)
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(200);
    setItems(((data as any[]) ?? []) as RawNews[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const colorByCode = Object.fromEntries(categories.map((c) => [c.code, c.color]));
  const nameByCode = Object.fromEntries(categories.map((c) => [c.code, c.name]));

  const filtered = items.filter((r) => {
    if (activeCategory && !r.trigger_categories?.includes(activeCategory)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.source_name || "").toLowerCase().includes(q) ||
        (r.matched_keywords || []).some((k) => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по заголовку, источнику, слову"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Обновить
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition-all ${
            activeCategory === null
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          Все
        </button>
        {categories.map((c) => {
          const isActive = activeCategory === c.code;
          return (
            <button
              key={c.code}
              onClick={() => setActiveCategory(isActive ? null : c.code)}
              className="px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition-all"
              style={
                isActive
                  ? { backgroundColor: c.color, color: "white", borderColor: c.color }
                  : { borderColor: "hsl(var(--border))" }
              }
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="text-xs text-muted-foreground">
        Показано {filtered.length} из {items.length}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Сырые новости пока не загружены парсером
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {r.source_name && (
                      <Badge variant="outline" className="text-[10px]">
                        {r.source_name}
                      </Badge>
                    )}
                    {(r.trigger_categories || []).map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: colorByCode[code] || "hsl(var(--muted))" }}
                      >
                        {nameByCode[code] || code}
                      </span>
                    ))}
                    {r.published_at && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.published_at).toLocaleString("ru-RU")}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[14px] font-semibold text-foreground leading-snug">
                    {r.title}
                  </h4>
                  {r.body_text && (
                    <p className="text-[12.5px] text-muted-foreground mt-1.5 line-clamp-2">
                      {r.body_text}
                    </p>
                  )}
                  {r.matched_keywords && r.matched_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.matched_keywords.map((k) => (
                        <span
                          key={k}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
