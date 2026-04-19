import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, ArrowLeft, Newspaper, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
// admin access controlled by AdminGuard (login/password gate)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminTriggersTab from "@/components/admin/AdminTriggersTab";
import AdminRawNewsTab from "@/components/admin/AdminRawNewsTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface NewsSource {
  id: string;
  slug: string;
  name: string;
  url: string | null;
  source_type: string;
  tier: string;
  is_active: boolean;
  parse_interval_min: number;
  triggers: any;
  description: string | null;
  last_parsed_at: string | null;
  last_status: string | null;
}

interface SourceWithCount extends NewsSource {
  newsCount: number;
}

const emptyForm: Partial<NewsSource> = {
  slug: "",
  name: "",
  url: "",
  source_type: "rss",
  tier: "primary",
  is_active: true,
  parse_interval_min: 15,
  description: "",
  triggers: { keywords: [], tickers: [], exclude_keywords: [], min_length: 0 },
};

export default function AdminSourcesPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<SourceWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<NewsSource> | null>(null);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [tickersInput, setTickersInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: srcs } = await supabase
      .from("news_sources")
      .select("*")
      .order("tier", { ascending: true })
      .order("name", { ascending: true });

    const list = (srcs || []) as NewsSource[];
    // Считаем новости по slug (есть и source_id, и source_slug — берём slug, т.к. старые данные без id)
    const counts: Record<string, number> = {};
    await Promise.all(
      list.map(async (s) => {
        const { count } = await supabase
          .from("news")
          .select("id", { count: "exact", head: true })
          .or(`source_id.eq.${s.id},source_slug.eq.${s.slug}`);
        counts[s.id] = count ?? 0;
      })
    );

    setSources(list.map((s) => ({ ...s, newsCount: counts[s.id] ?? 0 })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.url || "").toLowerCase().includes(q)
    );
  }, [sources, search]);

  const openCreate = () => {
    setEditing({ ...emptyForm });
    setKeywordsInput("");
    setTickersInput("");
    setExcludeInput("");
  };

  const openEdit = (s: NewsSource) => {
    setEditing({ ...s });
    const t = s.triggers || {};
    setKeywordsInput((t.keywords || []).join(", "));
    setTickersInput((t.tickers || []).join(", "));
    setExcludeInput((t.exclude_keywords || []).join(", "));
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.slug?.trim() || !editing.name?.trim()) {
      toast({ title: "Заполните slug и название", variant: "destructive" });
      return;
    }
    const triggers = {
      keywords: keywordsInput.split(",").map((s) => s.trim()).filter(Boolean),
      tickers: tickersInput
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      exclude_keywords: excludeInput.split(",").map((s) => s.trim()).filter(Boolean),
      min_length: Number((editing.triggers as any)?.min_length ?? 0) || 0,
    };
    const payload = {
      slug: editing.slug.trim(),
      name: editing.name.trim(),
      url: editing.url || null,
      source_type: editing.source_type || "rss",
      tier: editing.tier || "primary",
      is_active: editing.is_active ?? true,
      parse_interval_min: Number(editing.parse_interval_min) || 15,
      description: editing.description || null,
      triggers,
    };

    if (editing.id) {
      const { error } = await supabase
        .from("news_sources")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Источник обновлён" });
    } else {
      const { error } = await supabase.from("news_sources").insert(payload);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Источник создан" });
    }
    setEditing(null);
    load();
  };

  const toggleActive = async (s: SourceWithCount) => {
    const { error } = await supabase
      .from("news_sources")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const remove = async (s: SourceWithCount) => {
    if (!confirm(`Удалить источник «${s.name}»? Связанные новости останутся, но без источника.`))
      return;
    const { error } = await supabase.from("news_sources").delete().eq("id", s.id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    load();
  };

  const totalNews = sources.reduce((sum, s) => sum + s.newsCount, 0);
  const activeCount = sources.filter((s) => s.is_active).length;

  // (header continues below)


  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/news")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Админ-панель</h1>
            <p className="text-sm text-muted-foreground">
              {sources.length} источников · {activeCount} активных · {totalNews} новостей
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-5">
        <TabsList>
          <TabsTrigger value="sources">Источники</TabsTrigger>
          <TabsTrigger value="triggers">Триггеры</TabsTrigger>
          <TabsTrigger value="raw">Сырые новости</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="mt-0">
          <AdminTriggersTab />
        </TabsContent>

        <TabsContent value="raw" className="mt-0">
          <AdminRawNewsTab />
        </TabsContent>

        <TabsContent value="sources" className="space-y-5 mt-0">
          <div className="flex items-center justify-end">
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Добавить источник
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, slug или URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Источник</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Тариф</TableHead>
              <TableHead className="text-center">Новостей</TableHead>
              <TableHead className="text-center">Активен</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Ничего не найдено
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {s.source_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        s.tier === "exclusive"
                          ? "bg-primary/15 text-primary"
                          : s.tier === "extra"
                            ? "bg-accent text-foreground"
                            : ""
                      }
                    >
                      {s.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.newsCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(s)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Редактировать источник" : "Новый источник"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Slug *</Label>
                  <Input
                    value={editing.slug || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                    }
                    placeholder="rbc"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Название *</Label>
                  <Input
                    value={editing.name || ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="РБК"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>URL источника</Label>
                <Input
                  value={editing.url || ""}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  placeholder="https://rssexport.rbc.ru/rbcnews/news/30/full.rss"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Тип</Label>
                  <Select
                    value={editing.source_type || "rss"}
                    onValueChange={(v) => setEditing({ ...editing, source_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rss">RSS</SelectItem>
                      <SelectItem value="html">HTML scrape</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Тариф</Label>
                  <Select
                    value={editing.tier || "primary"}
                    onValueChange={(v) => setEditing({ ...editing, tier: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Интервал, мин</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.parse_interval_min ?? 15}
                    onChange={(e) =>
                      setEditing({ ...editing, parse_interval_min: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Триггеры парсинга
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ключевые слова (через запятую)</Label>
                  <Input
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    placeholder="дивиденды, отчётность, IPO"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Тикеры (через запятую)</Label>
                  <Input
                    value={tickersInput}
                    onChange={(e) => setTickersInput(e.target.value)}
                    placeholder="SBER, GAZP, LKOH"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Стоп-слова (через запятую)</Label>
                  <Input
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    placeholder="реклама, спонсор"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Минимальная длина текста</Label>
                  <Input
                    type="number"
                    min={0}
                    value={(editing.triggers as any)?.min_length ?? 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        triggers: {
                          ...(editing.triggers || {}),
                          min_length: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  {editing.is_active ? (
                    <Power className="w-4 h-4 text-primary" />
                  ) : (
                    <PowerOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">Активен</span>
                </div>
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button onClick={save}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

