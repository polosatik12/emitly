import { X } from "lucide-react";
import { FilterChip } from "./FilterChip";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FiltersModalProps {
  open: boolean;
  onClose: () => void;
}

const categories = ["Все категории", "Отчётность", "Дивиденды", "Сделки", "Менеджмент", "Аналитика", "Регуляторика", "Инсайды", "Макро", "События"];
const sources = ["Все источники", "РБК", "Интерфакс", "ТАСС", "Ведомости", "Smart-Lab", "Финам"];
const periods = ["Всё время", "Сегодня", "Неделя", "Месяц"];
const sectors = ["Все секторы", "Нефть и газ", "Банки", "Металлы", "Телеком", "Ритейл", "Энергетика", "Транспорт", "IT", "Химия"];

export function FiltersModal({ open, onClose }: FiltersModalProps) {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("Все категории");
  const [selectedSource, setSelectedSource] = useState("Все источники");
  const [selectedPeriod, setSelectedPeriod] = useState("Всё время");
  const [selectedSector, setSelectedSector] = useState("Все секторы");

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
          <Section title="Источник" items={sources} selected={selectedSource} onSelect={setSelectedSource} />
          <Section title="Период" items={periods} selected={selectedPeriod} onSelect={setSelectedPeriod} />
          <Section title="Сектор" items={sectors} selected={selectedSector} onSelect={setSelectedSector} />

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
