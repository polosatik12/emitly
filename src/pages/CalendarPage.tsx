import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight, Maximize2, Heart, Coins, FileText, Users, CalendarDays, ExternalLink } from "lucide-react";
import { CategoryBadge } from "@/components/CategoryBadge";
import EventDetailDrawer from "@/components/EventDetailDrawer";
import { addDays, startOfWeek, format, isSameDay, isToday as isTodayFn } from "date-fns";
import { ru } from "date-fns/locale";

const weekDayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const calendarEvents = [
  {
    id: "1",
    ticker: "TATNP",
    category: "Дивиденды",
    title: "Дивиденды TATNP",
    subtitle: "Закрытие реестра",
    amount: "17.39 RUB на акцию",
    source: "Источник",
    date: new Date(2026, 0, 8),
    dateLabel: "8 ЯНВ.",
  },
  {
    id: "2",
    ticker: "TATN",
    category: "Дивиденды",
    title: "Дивиденды TATN",
    subtitle: "Закрытие реестра",
    amount: "15.20 RUB на акцию",
    source: "Источник",
    date: new Date(2026, 0, 8),
    dateLabel: "8 ЯНВ.",
  },
  {
    id: "3",
    ticker: "LKON",
    category: "Собрание",
    title: "Внеочередное общее собрание акционеров LKON",
    subtitle: "ВОСА",
    amount: "",
    source: "",
    date: new Date(2025, 11, 29),
    dateLabel: "29 ДЕК.",
  },
  {
    id: "4",
    ticker: "GAZP",
    category: "Отчёты",
    title: "Годовой отчёт Газпром",
    subtitle: "Финансовая отчётность за 2025",
    amount: "",
    source: "Источник",
    date: new Date(),
    dateLabel: format(new Date(), "d MMM.", { locale: ru }).toUpperCase(),
  },
  {
    id: "5",
    ticker: "SBER",
    category: "Дивиденды",
    title: "Дивиденды SBER",
    subtitle: "Закрытие реестра",
    amount: "33.30 RUB на акцию",
    source: "Источник",
    date: addDays(new Date(), 2),
    dateLabel: format(addDays(new Date(), 2), "d MMM.", { locale: ru }).toUpperCase(),
  },
  {
    id: "6",
    ticker: "YNDX",
    category: "Событие",
    title: "День инвестора Яндекс",
    subtitle: "Онлайн-трансляция",
    amount: "",
    source: "Источник",
    date: addDays(new Date(), 5),
    dateLabel: format(addDays(new Date(), 5), "d MMM.", { locale: ru }).toUpperCase(),
  },
];

interface CategoryTab {
  label: string;
  icon: React.ReactNode;
  value: string;
}

const eventCategories: CategoryTab[] = [
  { label: "Все", icon: <CalendarDays className="w-[13px] h-[13px]" />, value: "Все" },
  { label: "Дивиденды", icon: <Coins className="w-[13px] h-[13px]" />, value: "Дивиденды" },
  { label: "Отчёты", icon: <FileText className="w-[13px] h-[13px]" />, value: "Отчёты" },
  { label: "Собрания", icon: <Users className="w-[13px] h-[13px]" />, value: "Собрания" },
  { label: "События", icon: <CalendarDays className="w-[13px] h-[13px]" />, value: "События" },
];

const tickerColors: Record<string, string> = {
  "TATNP": "bg-[#2C3E50]",
  "TATN": "bg-[#34495E]",
  "LKON": "bg-[#C0392B]",
  "GAZP": "bg-[#2980B9]",
  "SBER": "bg-[#00B856]",
  "YNDX": "bg-[#FC3F1D]",
};

const categoryBorderColors: Record<string, string> = {
  "Дивиденды": "border-l-[hsl(var(--news-positive))]",
  "Собрание": "border-l-[hsl(var(--news-negative))]",
  "Отчёты": "border-l-[hsl(var(--news-blue))]",
  "Событие": "border-l-[hsl(var(--badge-deal))]",
};

function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 13);
  const start = format(weekStart, "d MMM.", { locale: ru });
  const end = format(weekEnd, "d MMM.", { locale: ru });
  return `${start} - ${end}`;
}

function getFullDateLabel(date: Date): string {
  return format(date, "d MMMM, EEEE", { locale: ru });
}

export default function CalendarPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<typeof calendarEvents[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [dateFilter, setDateFilter] = useState<"all" | "today">("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("emitly-calendar-favs");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const baseWeekStart = getWeekStart(today);
  const currentWeekStart = addDays(baseWeekStart, weekOffset * 14);

  const week1 = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const week2 = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, 7 + i));

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("emitly-calendar-favs", JSON.stringify([...next]));
      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    let events = calendarEvents;

    if (activeTab === "my") {
      events = events.filter(e => favorites.has(e.id));
    }

    if (selectedCategory !== "Все") {
      events = events.filter(e =>
        e.category === selectedCategory ||
        (selectedCategory === "Собрания" && e.category === "Собрание") ||
        (selectedCategory === "События" && e.category === "Событие")
      );
    }

    if (dateFilter === "today") {
      events = events.filter(e => isTodayFn(e.date));
    }

    if (selectedDate) {
      events = events.filter(e => isSameDay(e.date, selectedDate));
    }

    return events;
  }, [activeTab, selectedCategory, dateFilter, selectedDate, favorites]);

  const groupedEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
    return sorted.reduce((acc, ev) => {
      const label = getFullDateLabel(ev.date);
      if (!acc[label]) acc[label] = [];
      acc[label].push(ev);
      return acc;
    }, {} as Record<string, typeof calendarEvents>);
  }, [filteredEvents]);

  const handleDateClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      setDateFilter("all");
    }
  };

  const handleDateFilter = (filter: "all" | "today") => {
    setDateFilter(filter);
    setSelectedDate(null);
  };

  return (
    <div className={isMobile ? "flex flex-col min-h-screen max-w-lg mx-auto pb-[60px] bg-background" : "flex flex-col min-h-screen max-w-[720px] mx-auto py-6 px-6 bg-background"}>
      {/* Шапка */}
      {isMobile ? (
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-border overflow-hidden active:scale-95 transition-transform">
              <span className="text-[13px] font-bold text-muted-foreground">AN</span>
            </button>
            <h1 className="text-[17px] font-bold text-foreground">Календарь событий</h1>
          </div>
          <div className="flex bg-muted rounded-[8px] p-[2px] border border-border">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-[4px] text-[12px] rounded-[6px] font-medium transition-colors ${
                activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-3 py-[4px] text-[12px] rounded-[6px] font-medium transition-colors ${
                activeTab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Мои
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[24px] font-bold text-foreground">Календарь событий</h1>
          <div className="flex bg-muted rounded-[8px] p-[2px] border border-border">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 text-[13px] rounded-[6px] font-medium transition-colors ${
                activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-1.5 text-[13px] rounded-[6px] font-medium transition-colors ${
                activeTab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Мои
            </button>
          </div>
        </div>
      )}

      {/* Календарь */}
      <div className={isMobile ? "mx-4 border border-border rounded-[16px] p-3.5 mb-3" : "border border-border rounded-[16px] p-4 mb-4"}>
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-muted-foreground p-0.5 active:scale-90 transition-transform">
            <ChevronLeft className="w-[15px] h-[15px]" />
          </button>
          <span className="text-[12.5px] font-semibold text-foreground">{formatWeekRange(currentWeekStart)}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setWeekOffset(w => w + 1)} className="text-muted-foreground p-0.5 active:scale-90 transition-transform">
              <ChevronRight className="w-[15px] h-[15px]" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="text-muted-foreground p-0.5 active:scale-90 transition-transform">
              <Maximize2 className="w-[13px] h-[13px]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0 mb-0.5">
          {weekDayLabels.map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-0.5">{d}</div>
          ))}
        </div>

        {[week1, week2].map((week, wi) => (
          <div key={wi} className={`grid grid-cols-7 gap-0 ${wi === 0 ? "mb-0.5" : "mb-2.5"}`}>
            {week.map((d, di) => {
              const isToday = isTodayFn(d);
              const isSelected = selectedDate && isSameDay(selectedDate, d);
              const hasEvents = calendarEvents.some(ev => isSameDay(ev.date, d));

              return (
                <button
                  key={di}
                  onClick={() => handleDateClick(d)}
                  className={`text-center py-[6px] text-[13.5px] rounded-full transition-colors mx-auto w-[34px] relative ${
                    isSelected
                      ? "bg-chip-selected-bg text-white font-bold"
                      : isToday
                      ? "bg-accent text-accent-foreground font-bold"
                      : "text-foreground hover:bg-muted font-medium"
                  }`}
                >
                  {d.getDate()}
                  {hasEvents && !isSelected && (
                    <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        <div className="flex gap-2">
          <button
            onClick={() => handleDateFilter("all")}
            className={`flex-1 text-[12.5px] font-semibold py-[9px] rounded-full transition-colors ${
              dateFilter === "all" && !selectedDate
                ? "bg-chip-selected-bg text-white"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Все даты
          </button>
          <button
            onClick={() => handleDateFilter("today")}
            className={`flex-1 text-[12.5px] font-semibold py-[9px] rounded-full transition-colors ${
              dateFilter === "today"
                ? "bg-chip-selected-bg text-white"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Сегодня
          </button>
        </div>
      </div>

      {/* Фильтры категорий */}
      <div className={isMobile ? "px-4 mb-3.5 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" : "mb-4 flex gap-2 flex-wrap pb-0.5"}>
        {eventCategories.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1 px-3.5 py-[7px] rounded-full text-[12px] font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-chip-selected-bg text-white border-chip-selected-bg"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* События */}
      <div className={isMobile ? "px-4 space-y-4 flex-1 pb-4" : "space-y-4 flex-1 pb-4"}>
        {Object.keys(groupedEvents).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="w-[40px] h-[40px] text-muted-foreground mb-3" />
            <p className="text-[14px] font-semibold text-foreground mb-1">
              {activeTab === "my" ? "Нет избранных событий" : "Нет событий"}
            </p>
            <p className="text-[12.5px] text-muted-foreground">
              {activeTab === "my" ? "Нажмите ♡ чтобы добавить события в избранное" : "Попробуйте изменить фильтры"}
            </p>
          </div>
        )}

        {Object.entries(groupedEvents).map(([dateLabel, events]) => (
          <div key={dateLabel}>
            <p className="text-[12.5px] text-foreground mb-2 font-semibold italic">{dateLabel}</p>
            <div className="space-y-2.5">
              {events.map((ev) => {
                const bgColor = tickerColors[ev.ticker] || "bg-[#7F8C8D]";
                const borderColor = categoryBorderColors[ev.category] || "border-l-primary";
                const isFav = favorites.has(ev.id);
                return (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)} className={`bg-card border border-border rounded-[16px] p-3.5 card-shadow border-l-[3.5px] ${borderColor} cursor-pointer active:scale-[0.98] transition-transform`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-[26px] h-[26px] rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
                          <span className="text-[8px] font-bold text-white">{ev.ticker.slice(0, 2)}</span>
                        </div>
                        <span className="font-bold text-[13.5px] text-foreground">{ev.ticker}</span>
                        <CategoryBadge category={ev.category} />
                      </div>
                      <button onClick={() => toggleFavorite(ev.id)} className="active:scale-90 transition-transform">
                        <Heart
                          className={`w-[18px] h-[18px] transition-colors ${isFav ? "text-[hsl(var(--news-negative))] fill-[hsl(var(--news-negative))]" : "text-muted-foreground"}`}
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>
                    <p className="text-[13px] font-medium mb-0.5 text-foreground">{ev.title}</p>
                    {ev.subtitle && <p className="text-[11.5px] text-muted-foreground">{ev.subtitle}</p>}
                    {ev.amount && <p className="text-[13.5px] font-bold mt-1.5 text-primary">{ev.amount}</p>}
                    <div className="flex items-center justify-between mt-2.5">
                      {ev.source ? (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <ExternalLink className="w-[11px] h-[11px]" />
                          {ev.source}
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-0.5">
                        <span className="text-[11.5px] text-foreground font-bold tracking-wide">{ev.dateLabel}</span>
                        <ChevronRight className="w-[13px] h-[13px] text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <EventDetailDrawer
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        isFavorite={selectedEvent ? favorites.has(selectedEvent.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
