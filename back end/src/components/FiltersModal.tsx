import { X, ChevronDown } from "lucide-react";
import { FilterChip } from "./FilterChip";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { NEWS_SOURCES } from "@/data/sources";

export type FilterPeriod = "all" | "today" | "week" | "month";

export interface FilterState {
  category: string; // "Все категории" or one of `categories`
  period: FilterPeriod;
  sectors: string[]; // empty = все
  sources: string[]; // empty = все, иначе id из NEWS_SOURCES
}

export const DEFAULT_FILTERS: FilterState = {
  category: "Все категории",
  period: "all",
  sectors: [],
  sources: [],
};

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
  value?: FilterState;
  onApply?: (next: FilterState) => void;
}

const categories = [
  "Все категории",
  "Отчётность",
  "Дивиденды",
  "Сделки",
  "Менеджмент",
  "Аналитика",
  "Регуляторика",
  "Инсайды",
  "Макро",
  "События",
  "Аномальные объёмы",
];

const periodOptions: { label: string; value: FilterPeriod }[] = [
  { label: "Всё время", value: "all" },
  { label: "Сегодня", value: "today" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" },
];

const sectors = [
  "Нефть и газ",
  "Банки",
  "Металлы",
  "Телеком",
  "Ритейл",
  "Энергетика",
  "Транспорт",
  "IT",
  "Химия",
];

const ALL_SECTORS = "Все секторы";
const ALL_SOURCES = "Все источники";

const primarySources = NEWS_SOURCES.filter((s) => s.category === "primary").slice(0, 4);
const extraSources = [
  ...NEWS_SOURCES.filter((s) => s.category === "primary").slice(4),
  ...NEWS_SOURCES.filter((s) => s.category === "extra"),
];

export function FiltersModal({ open, onClose, value, onApply }: FiltersModalProps) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<FilterState>(value ?? DEFAULT_FILTERS);
  const [showMoreSources, setShowMoreSources] = useState(false);

  // Sync external value when modal opens
  useEffect(() => {
    if (open) setDraft(value ?? DEFAULT_FILTERS);
  }, [open, value]);

  const setCategory = (c: string) => setDraft((d) => ({ ...d, category: c }));
  const setPeriod = (p: FilterPeriod) => setDraft((d) => ({ ...d, period: p }));

  const toggleSector = (sector: string) => {
    if (sector === ALL_SECTORS) {
      setDraft((d) => ({ ...d, sectors: [] }));
      return;
    }
    setDraft((d) => ({
      ...d,
      sectors: d.sectors.includes(sector)
        ? d.sectors.filter((s) => s !== sector)
        : [...d.sectors, sector],
    }));
  };
  const isSectorActive = (sector: string) =>
    sector === ALL_SECTORS ? draft.sectors.length === 0 : draft.sectors.includes(sector);

  const toggleSource = (sourceId: string) => {
    if (sourceId === ALL_SOURCES) {
      setDraft((d) => ({ ...d, sources: [] }));
      return;
    }
    setDraft((d) => ({
      ...d,
      sources: d.sources.includes(sourceId)
        ? d.sources.filter((s) => s !== sourceId)
        : [...d.sources, sourceId],
    }));
  };
  const isSourceActive = (sourceId: string) =>
    sourceId === ALL_SOURCES ? draft.sources.length === 0 : draft.sources.includes(sourceId);

  const handleApply = () => {
    onApply?.(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-background/95 z-[60] ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 z-[60] flex ${isMobile ? "items-end" : "items-center"} justify-center transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className={`bg-card max-h-[85vh] overflow-y-auto flex flex-col transition-transform duration-300 ease-out ${
            isMobile
              ? `w-full max-w-lg rounded-t-[24px] p-5 pb-5 ${open ? "translate-y-0" : "translate-y-full"}`
              : `w-full max-w-[520px] rounded-2xl p-6 shadow-xl ${open ? "scale-100" : "scale-95"}`
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[17px] font-bold text-foreground">Фильтры</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Сбросить
              </button>
              <button
                onClick={onClose}
                className="text-muted-foreground p-1 active:scale-90 hover:text-foreground transition-all duration-150"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Категория */}
          <Section
            title="Категория"
            items={categories}
            selected={draft.category}
            onSelect={setCategory}
          />

          {/* Период */}
          <div className="mb-5">
            <p className="text-[12.5px] text-muted-foreground mb-2.5">Период</p>
            <div className="flex flex-wrap gap-[6px]">
              {periodOptions.map((p) => (
                <FilterChip
                  key={p.value}
                  label={p.label}
                  selected={draft.period === p.value}
                  onClick={() => setPeriod(p.value)}
                />
              ))}
            </div>
          </div>

          {/* Сектор */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12.5px] text-muted-foreground">
                Сектор
                {draft.sectors.length > 0 && (
                  <span className="ml-1.5 text-primary font-medium">· {draft.sectors.length}</span>
                )}
              </p>
              {draft.sectors.length > 0 && (
                <button
                  onClick={() => setDraft((d) => ({ ...d, sectors: [] }))}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Очистить
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-[6px]">
              <FilterChip
                label={ALL_SECTORS}
                selected={isSectorActive(ALL_SECTORS)}
                onClick={() => toggleSector(ALL_SECTORS)}
              />
              {sectors.map((item) => (
                <FilterChip
                  key={item}
                  label={item}
                  selected={isSectorActive(item)}
                  onClick={() => toggleSector(item)}
                />
              ))}
            </div>
          </div>

          {/* Источник */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12.5px] text-muted-foreground">
                Источник
                {draft.sources.length > 0 && (
                  <span className="ml-1.5 text-primary font-medium">· {draft.sources.length}</span>
                )}
              </p>
              {draft.sources.length > 0 && (
                <button
                  onClick={() => setDraft((d) => ({ ...d, sources: [] }))}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Очистить
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-[6px]">
              <FilterChip
                label={ALL_SOURCES}
                selected={isSourceActive(ALL_SOURCES)}
                onClick={() => toggleSource(ALL_SOURCES)}
              />
              {primarySources.map((item) => (
                <FilterChip
                  key={item.id}
                  label={item.name}
                  selected={isSourceActive(item.id)}
                  onClick={() => toggleSource(item.id)}
                />
              ))}
              {showMoreSources &&
                extraSources.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.name}
                    selected={isSourceActive(item.id)}
                    onClick={() => toggleSource(item.id)}
                  />
                ))}
              <button
                onClick={() => setShowMoreSources((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-[7px] rounded-full text-[13px] font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors active:scale-95"
              >
                {showMoreSources ? "Свернуть" : "Ещё"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showMoreSources ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={handleApply}
            className="w-full mt-0 bg-chip-selected-bg text-white rounded-[14px] py-[13px] font-semibold text-[14.5px] active:scale-[0.97] hover:brightness-110 transition-all duration-150"
          >
            Применить
          </button>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="text-[12.5px] text-muted-foreground mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-[6px]">
        {items.map((item) => (
          <FilterChip
            key={item}
            label={item}
            selected={selected === item}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}
