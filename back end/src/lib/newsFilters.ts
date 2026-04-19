import type { NewsItem } from "@/hooks/useNews";
import type { FilterState } from "@/components/FiltersModal";

// Маппинг категорий из FiltersModal к значениям, которые приходят с бэка
// (часть значений в БД сокращена/иначе именована).
const categoryMap: Record<string, string[]> = {
  "Отчётность": ["Отчётность", "Отчёты"],
  "Дивиденды": ["Дивиденды"],
  "Сделки": ["Сделки", "Сделка"],
  "Менеджмент": ["Менеджмент"],
  "Аналитика": ["Аналитика"],
  "Регуляторика": ["Регуляторика", "Событие"],
  "Инсайды": ["Инсайды"],
  "Макро": ["Макро"],
  "События": ["События", "Событие"],
  "Аномальные объёмы": ["Аномальные объёмы"],
};

function periodCutoff(period: FilterState["period"]): number | null {
  const now = Date.now();
  switch (period) {
    case "today":
      return now - 24 * 60 * 60 * 1000;
    case "week":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "month":
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

export function applyNewsFilters<T extends NewsItem & { source_slug?: string | null; sector?: string }>(
  items: T[],
  filters: FilterState,
): T[] {
  const cutoff = periodCutoff(filters.period);
  const cats = filters.category !== "Все категории" ? categoryMap[filters.category] ?? [filters.category] : null;

  return items.filter((n) => {
    // Категория
    if (cats && !cats.includes(n.category)) return false;

    // Период
    if (cutoff != null) {
      // Берём fullDate (ISO) если есть, иначе date
      const ts = n.fullDate ? new Date(n.fullDate).getTime() : NaN;
      const t = Number.isFinite(ts) ? ts : 0;
      if (t < cutoff) return false;
    }

    // Сектор
    if (filters.sectors.length > 0) {
      if (!n.sector || !filters.sectors.includes(n.sector)) return false;
    }

    // Источник
    if (filters.sources.length > 0) {
      const slug = (n as any).source_slug as string | undefined;
      if (!slug || !filters.sources.includes(slug)) return false;
    }

    return true;
  });
}

export function activeFiltersCount(filters: FilterState): number {
  let n = 0;
  if (filters.category !== "Все категории") n++;
  if (filters.period !== "all") n++;
  if (filters.sectors.length > 0) n++;
  if (filters.sources.length > 0) n++;
  return n;
}
