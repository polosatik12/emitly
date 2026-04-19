import { useState, useEffect } from "react";
import { ArrowLeft, BellOff, Search, SlidersHorizontal, TrendingUp, Clock, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerOverlay } from "@/components/ui/drawer";
import { CategoryBadge } from "@/components/CategoryBadge";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarEvent {
  id: string;
  ticker: string;
  category: string;
  title: string;
  subtitle: string;
  amount: string;
  source: string;
  date: Date;
  dateLabel: string;
}

interface EventDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

/* ─── mock data per ticker ─── */
const companyData: Record<string, {
  name: string;
  ticker: string;
  logo: string;
  logoColor: string;
  pe: string;
  pb: string;
  evEbitda: string;
  ndEbitda: string;
  price: string;
  changePercent: string;
  isPositive: boolean;
  cap: string;
  tradingViewSymbol: string;
}> = {
  TATNP: { name: "Татнефть-п", ticker: "TATNP", logo: "Т", logoColor: "#2C3E50", pe: "5.1", pb: "1.20", evEbitda: "3.8", ndEbitda: "-0.3", price: "583,50", changePercent: "+1.24", isPositive: true, cap: "1 370 млрд", tradingViewSymbol: "RUS:TATNP" },
  TATN: { name: "Татнефть", ticker: "TATN", logo: "Т", logoColor: "#34495E", pe: "5.3", pb: "1.25", evEbitda: "3.9", ndEbitda: "-0.2", price: "612,80", changePercent: "+0.87", isPositive: true, cap: "1 430 млрд", tradingViewSymbol: "RUS:TATN" },
  LKON: { name: "Лукойл", ticker: "LKOH", logo: "Л", logoColor: "#C0392B", pe: "4.8", pb: "0.90", evEbitda: "2.9", ndEbitda: "-0.5", price: "7 245,00", changePercent: "-0.32", isPositive: false, cap: "4 720 млрд", tradingViewSymbol: "RUS:LKOH" },
  GAZP: { name: "Газпром", ticker: "GAZP", logo: "Г", logoColor: "#2980B9", pe: "3.2", pb: "0.35", evEbitda: "3.1", ndEbitda: "1.2", price: "152,36", changePercent: "-0.58", isPositive: false, cap: "3 610 млрд", tradingViewSymbol: "RUS:GAZP" },
  SBER: { name: "Сбербанк", ticker: "SBER", logo: "С", logoColor: "#00B856", pe: "4.1", pb: "1.10", evEbitda: "—", ndEbitda: "—", price: "303,45", changePercent: "+0.92", isPositive: true, cap: "6 830 млрд", tradingViewSymbol: "RUS:SBER" },
  YNDX: { name: "Яндекс", ticker: "YNDX", logo: "Я", logoColor: "#FC3F1D", pe: "28.5", pb: "7.20", evEbitda: "15.3", ndEbitda: "0.8", price: "4 128,00", changePercent: "+1.56", isPositive: true, cap: "1 490 млрд", tradingViewSymbol: "RUS:YNDX" },
};

const mockNews = [
  { id: "n1", category: "Аналитика", date: "3 февр.", title: "Магнит: рост выручки на 12% по итогам квартала" },
  { id: "n2", category: "Дивиденды", date: "1 февр.", title: "Совет директоров рекомендовал дивиденды за 2025 год" },
  { id: "n3", category: "Отчёты", date: "28 янв.", title: "Публикация отчётности по МСФО за 4 квартал" },
];

export default function EventDetailDrawer({ open, onClose, event }: EventDetailDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const isMobile = useIsMobile();

  // Сбрасываем fullscreen при закрытии модалки
  useEffect(() => {
    if (!open) setFullscreen(false);
  }, [open]);

  if (!event) return null;

  const company = companyData[event.ticker] || {
    name: event.ticker,
    ticker: event.ticker,
    logo: event.ticker.slice(0, 1),
    logoColor: "#7F8C8D",
    pe: "—",
    pb: "—",
    evEbitda: "—",
    ndEbitda: "—",
    price: "—",
    changePercent: "0.00",
    isPositive: true,
    cap: "—",
    tradingViewSymbol: `RUS:${event.ticker}`,
  };

  const metrics = [
    { label: "P/E", value: company.pe },
    { label: "P/B", value: company.pb },
    { label: "EV/EBITDA", value: company.evEbitda },
    { label: "ND/EBITDA", value: company.ndEbitda },
  ];

  const innerContent = (
    <div className={isMobile ? "overflow-y-auto max-h-[90vh]" : `overflow-y-auto ${fullscreen ? "max-h-[calc(100vh-32px)]" : "max-h-[85vh]"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2 pt-2">
            <button onClick={onClose} className="p-1 active:scale-95 transition-transform">
              {isMobile ? (
                <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
              ) : (
                <X className="h-5 w-5 text-foreground" strokeWidth={2} />
              )}
            </button>
            <div className="flex items-center gap-3 flex-1 ml-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: company.logoColor }}
              >
                <span className="text-[14px] font-bold text-white">{company.logo}</span>
              </div>
              <div>
                <p className="text-[15px] font-bold leading-tight text-foreground">{company.name}</p>
                <p className="text-[12px] text-muted-foreground leading-none mt-0.5">{company.ticker}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMobile && (
                <button
                  onClick={() => setFullscreen((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-muted active:scale-95 transition-all"
                  title={fullscreen ? "Свернуть" : "Развернуть"}
                  aria-label={fullscreen ? "Свернуть" : "Развернуть"}
                >
                  {fullscreen ? (
                    <Minimize2 className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
                  ) : (
                    <Maximize2 className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
                  )}
                </button>
              )}
              <button className="p-1 active:scale-95 transition-transform">
                <BellOff className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* Financial metrics chips */}
          <div className="flex gap-2 px-4 pt-2 pb-3 overflow-x-auto scrollbar-hide">
            {metrics.map((m) => (
              <span
                key={m.label}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[hsl(var(--border))] bg-card px-3 py-[5px] text-[12px] text-muted-foreground"
              >
                {m.label} <span className="font-bold text-foreground">{m.value}</span>
              </span>
            ))}
          </div>

          {/* Price row */}
          <div className="flex items-baseline justify-between px-4 pb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold text-foreground leading-none">{company.price} ₽</span>
              <span className={`flex items-center gap-1 text-[14px] font-semibold ${company.isPositive ? "text-[hsl(var(--news-positive))]" : "text-[hsl(var(--news-negative))]"}`}>
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
                {company.isPositive ? "+" : ""}{company.changePercent}%
              </span>
            </div>
            <span className="text-[12px] text-muted-foreground">Кап: {company.cap} ₽</span>
          </div>

          {/* TradingView chart */}
          <div className="px-4 pb-2">
            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-card" style={{ height: 150 }}>
              <iframe
                src={`https://s.tradingview.com/embed-widget/advanced-chart/?symbol=${company.tradingViewSymbol}&interval=D&timezone=exchange&theme=light&style=1&locale=ru&hide_top_toolbar=true&hide_legend=true&hide_side_toolbar=false&allow_symbol_change=false&save_image=false&calendar=false&hide_volume=false&support_host=https%3A%2F%2Fwww.tradingview.com`}
                className="w-full border-0"
                style={{ height: 150 }}
                title="TradingView chart"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              />
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-2.5 leading-snug">
              Если график не появился, откройте его напрямую в{" "}
              <a
                href={`https://www.tradingview.com/chart/?symbol=${company.tradingViewSymbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--news-blue))]"
              >
                TradingView
              </a>.
            </p>
          </div>

          {/* Divider */}
          <div className="px-4 py-2">
            <div className="h-px w-full bg-[hsl(var(--border))]" />
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-card px-3.5 h-[44px]">
              <Search className="h-[16px] w-[16px] text-muted-foreground shrink-0" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Поиск новостей"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Filters button */}
          <div className="px-4 pb-3">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-card px-3.5 py-[7px] text-[13px] font-medium text-foreground active:scale-95 transition-transform">
              <SlidersHorizontal className="h-[14px] w-[14px]" strokeWidth={1.8} />
              Фильтры
            </button>
          </div>

          {/* News cards */}
          <div className="px-4 pb-8 space-y-3">
            {mockNews
              .filter((n) => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((news) => (
                <div
                  key={news.id}
                  className="bg-card border border-[hsl(var(--border))] rounded-2xl p-3.5 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between mb-2">
                    <CategoryBadge category={news.category} />
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-[11px] w-[11px]" strokeWidth={1.8} />
                      {news.date}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-medium text-foreground leading-snug flex-1">{news.title}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))}
        </div>
      </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerOverlay className="bg-black/40" />
        <DrawerContent className="max-h-[95vh] rounded-t-[18px] bg-card border-0 px-0">
          {innerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
          fullscreen ? "p-4" : "p-6"
        } ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div
          className={`w-full bg-card shadow-xl transition-all duration-300 ${
            fullscreen ? "max-w-none h-[calc(100vh-32px)] rounded-2xl" : "max-w-[700px] rounded-2xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {innerContent}
        </div>
      </div>
    </>
  );
}
