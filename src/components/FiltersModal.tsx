import { X, ChevronDown } from "lucide-react";
import { FilterChip } from "./FilterChip";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
}

const categories = ["Все категории", "Отчётность", "Дивиденды", "Сделки", "Менеджмент", "Аналитика", "Регуляторика", "Инсайды", "Макро", "События", "Аномальные объёмы"];
const periods = ["Всё время", "Сегодня", "Неделя", "Месяц"];
const sectors = ["Нефть и газ", "Банки", "Металлы", "Телеком", "Ритейл", "Энергетика", "Транспорт", "IT", "Химия"];

// Sources: first 4 visible by default, rest behind "Ещё"
const primarySources = ["РБК", "Интерфакс", "ТАСС", "Ведомости"];
const extraSources = ["Smart-Lab", "Финам", "Коммерсантъ", "Forbes", "E-Disclosure", "MOEX", "Banki.ru", "Frank Media"];

const ALL_SECTORS = "Все секторы";
const ALL_SOURCES = "Все источники";

export function FiltersModal({ open, onClose }: FiltersModalProps) {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("Все категории");
  const [selectedPeriod, setSelectedPeriod] = useState("Всё время");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showMoreSources, setShowMoreSources] = useState(false);

  const toggleSector = (sector: string) => {
    if (sector === ALL_SECTORS) {
      setSelectedSectors([]);
      return;
    }
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };
  const isSectorActive = (sector: string) =>
    sector === ALL_SECTORS ? selectedSectors.length === 0 : selectedSectors.includes(sector);

  const toggleSource = (source: string) => {
    if (source === ALL_SOURCES) {
      setSelectedSources([]);
      return;
    }
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };
  const isSourceActive = (source: string) =>
    source === ALL_SOURCES ? selectedSources.length === 0 : selectedSources.includes(source);

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
            <button onClick={onClose} className="text-muted-foreground p-1 active:scale-90 hover:text-foreground transition-all duration-150">
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>

          <Section title="Категория" items={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
          <Section title="Период" items={periods} selected={selectedPeriod} onSelect={setSelectedPeriod} />

          {/* Sector — multi-select */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12.5px] text-muted-foreground">
                Сектор
                {selectedSectors.length > 0 && (
                  <span className="ml-1.5 text-primary font-medium">· {selectedSectors.length}</span>
                )}
              </p>
              {selectedSectors.length > 0 && (
                <button
                  onClick={() => setSelectedSectors([])}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Сбросить
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

          {/* Source — multi-select with collapsible extras */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[12.5px] text-muted-foreground">
                Источник
                {selectedSources.length > 0 && (
                  <span className="ml-1.5 text-primary font-medium">· {selectedSources.length}</span>
                )}
              </p>
              {selectedSources.length > 0 && (
                <button
                  onClick={() => setSelectedSources([])}
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Сбросить
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
                  key={item}
                  label={item}
                  selected={isSourceActive(item)}
                  onClick={() => toggleSource(item)}
                />
              ))}
              {showMoreSources &&
                extraSources.map((item) => (
                  <FilterChip
                    key={item}
                    label={item}
                    selected={isSourceActive(item)}
                    onClick={() => toggleSource(item)}
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
            onClick={onClose}
            className="w-full mt-0 bg-chip-selected-bg text-white rounded-[14px] py-[13px] font-semibold text-[14.5px] active:scale-[0.97] hover:brightness-110 transition-all duration-150"
          >
            Применить
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ title, items, selected, onSelect }: { title: string; items: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="mb-5">
      <p className="text-[12.5px] text-muted-foreground mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-[6px]">
        {items.map((item) => (
          <FilterChip key={item} label={item} selected={selected === item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}
