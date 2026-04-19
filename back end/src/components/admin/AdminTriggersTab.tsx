import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useTriggerCategories } from "@/hooks/useTriggerCategories";

interface KeywordRow {
  id: string;
  category_id: string;
  subgroup: string;
  keyword: string;
  weight: number;
  is_active: boolean;
}

interface CategoryRow {
  id: string;
  code: string;
  name: string;
  color: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function AdminTriggersTab() {
  const { categories, reload: reloadCategories } = useTriggerCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newSubgroup, setNewSubgroup] = useState("Ключевые");
  const [newWeight, setNewWeight] = useState(2);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState("");

  // Pick first category once loaded
  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const loadKeywords = async (catId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("news_trigger_keywords" as any)
      .select("*")
      .eq("category_id", catId)
      .order("subgroup", { ascending: true })
      .order("keyword", { ascending: true });
    setKeywords(((data as any[]) ?? []) as KeywordRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (activeCategoryId) loadKeywords(activeCategoryId);
  }, [activeCategoryId]);

  const grouped = keywords.reduce<Record<string, KeywordRow[]>>((acc, k) => {
    (acc[k.subgroup] = acc[k.subgroup] || []).push(k);
    return acc;
  }, {});

  const addKeyword = async () => {
    if (!activeCategoryId || !newKeyword.trim()) return;
    const { error } = await supabase.from("news_trigger_keywords" as any).insert({
      category_id: activeCategoryId,
      subgroup: newSubgroup.trim() || "main",
      keyword: newKeyword.trim(),
      weight: Number(newWeight) || 1,
    });
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setNewKeyword("");
    toast({ title: "Слово добавлено" });
    loadKeywords(activeCategoryId);
  };

  const removeKeyword = async (id: string) => {
    if (!confirm("Удалить ключевое слово?")) return;
    const { error } = await supabase.from("news_trigger_keywords" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    if (activeCategoryId) loadKeywords(activeCategoryId);
  };

  const toggleKeyword = async (k: KeywordRow) => {
    await supabase
      .from("news_trigger_keywords" as any)
      .update({ is_active: !k.is_active })
      .eq("id", k.id);
    if (activeCategoryId) loadKeywords(activeCategoryId);
  };

  const saveEdit = async (id: string) => {
    if (!editKeyword.trim()) return;
    const { error } = await supabase
      .from("news_trigger_keywords" as any)
      .update({ keyword: editKeyword.trim() })
      .eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    setEditingId(null);
    if (activeCategoryId) loadKeywords(activeCategoryId);
  };

  const toggleCategory = async (c: CategoryRow) => {
    await supabase
      .from("news_trigger_categories" as any)
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    reloadCategories();
  };

  return (
    <div className="space-y-5">
      {/* Categories sidebar + content */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Категории
          </h3>
          {categories.map((c) => {
            const isActive = activeCategoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategoryId(c.id)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-semibold text-[14px] text-foreground truncate">
                      {c.name}
                    </span>
                  </div>
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={() => toggleCategory(c as any)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {c.description && (
                  <p className="text-[11.5px] text-muted-foreground mt-1 truncate">
                    {c.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Keywords for active category */}
        <div className="space-y-4">
          {/* Add keyword form */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Добавить ключевое слово
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_100px_auto] gap-2">
              <div>
                <Label className="text-xs">Слово / фраза</Label>
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="ключевая ставка"
                />
              </div>
              <div>
                <Label className="text-xs">Подгруппа</Label>
                <Input
                  value={newSubgroup}
                  onChange={(e) => setNewSubgroup(e.target.value)}
                  placeholder="Ключевые"
                />
              </div>
              <div>
                <Label className="text-xs">Вес</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addKeyword} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Добавить
                </Button>
              </div>
            </div>
          </div>

          {/* Keyword groups */}
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Загрузка…</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет ключевых слов в этой категории
            </div>
          ) : (
            Object.entries(grouped).map(([subgroup, items]) => (
              <div key={subgroup} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-bold text-foreground uppercase tracking-wider">
                    {subgroup}
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((k) => (
                    <div
                      key={k.id}
                      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] ${
                        k.is_active
                          ? "bg-muted border-border text-foreground"
                          : "bg-muted/30 border-border text-muted-foreground line-through"
                      }`}
                    >
                      {editingId === k.id ? (
                        <>
                          <input
                            value={editKeyword}
                            onChange={(e) => setEditKeyword(e.target.value)}
                            className="bg-transparent outline-none text-[12.5px] w-[160px]"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(k.id)}
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-muted-foreground hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{k.keyword}</span>
                          {k.weight > 1 && (
                            <span className="text-[10px] text-primary font-bold">×{k.weight}</span>
                          )}
                          <button
                            onClick={() => toggleKeyword(k)}
                            className="text-muted-foreground hover:text-foreground"
                            title={k.is_active ? "Выключить" : "Включить"}
                          >
                            {k.is_active ? (
                              <Power className="w-3 h-3" />
                            ) : (
                              <PowerOff className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(k.id);
                              setEditKeyword(k.keyword);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeKeyword(k.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
