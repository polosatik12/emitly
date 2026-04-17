import React from "react";
import { Clock, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { LockedNewsOverlay } from "./LockedNewsOverlay";
import { getEmitterByTicker } from "@/data/emitters";

interface NewsCardProps {
  id: string;
  ticker: string;
  category: string;
  date: string;
  title: string;
  bullPercent?: number;
  bearPercent?: number;
  comments?: number;
  source?: string | null;
  locked?: boolean;
  read?: boolean;
  onClick?: () => void;
}

const categoryBottomColors: Record<string, string> = {
  "Событие": "#00B856",
  "Сделка": "#E67E22",
  "Собрание": "#E74C3C",
  "Дивиденды": "#00B856",
  "Отчёты": "#3498DB",
};

export const NewsCard = React.memo(function NewsCard({ id, ticker, category, date, title, bullPercent = 50, bearPercent = 50, comments = 4, source, locked = false, read = false, onClick }: NewsCardProps) {
  const bottomColor = categoryBottomColors[category] || "#BDC3C7";
  const logo = getEmitterByTicker(ticker)?.logo;

  return (
    <div className="relative">
      <div
        className={`bg-card rounded-[16px] card-shadow border border-border overflow-hidden cursor-pointer active:scale-[0.97] hover:shadow-lg hover:-translate-y-[1px] transition-all duration-200 ease-out ${locked ? "blur-[5px] pointer-events-none select-none" : ""} ${read ? "opacity-60" : ""}`}
        onClick={onClick}
      >
        <div className="px-3.5 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt={ticker} className="w-[36px] h-[36px] rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-[32px] h-[32px] rounded-full bg-muted-foreground flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">{ticker.slice(0, 2)}</span>
                </div>
              )}
              <span className="font-extrabold text-[13.5px] tracking-[0.01em] text-foreground">{ticker}</span>
              <CategoryBadge category={category} />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-[12px] h-[12px] text-muted-foreground" strokeWidth={1.8} />
              <span className="text-[11.5px] text-muted-foreground">{date}</span>
            </div>
          </div>

          <p className="text-[13px] text-foreground leading-[1.42] mb-2.5 pr-2">{title}</p>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-[2px]">
              <TrendingUp className="w-[9px] h-[9px] text-[hsl(var(--news-positive))]" strokeWidth={2.2} />
              <span className="text-[9px] font-semibold text-[hsl(var(--news-positive))]">{bullPercent}%</span>
            </div>

            <div className="w-[32px] h-[6px] rounded-full overflow-hidden flex">
              <div className="h-full bg-[hsl(var(--news-positive))] rounded-l-full" style={{ width: `${bullPercent}%` }} />
              <div className="h-full bg-[hsl(var(--news-negative))] rounded-r-full" style={{ width: `${bearPercent}%` }} />
            </div>

            <div className="flex items-center gap-[2px]">
              <span className="text-[9px] font-semibold text-[hsl(var(--news-negative))]">{bearPercent}%</span>
              <TrendingDown className="w-[9px] h-[9px] text-[hsl(var(--news-negative))]" strokeWidth={2.2} />
            </div>

            <ChevronRight className="w-[12px] h-[12px] text-muted-foreground" strokeWidth={1.8} />
          </div>
        </div>

        <div className="h-[3px] w-full" style={{ backgroundColor: bottomColor }} />
      </div>

      {locked && <LockedNewsOverlay source={source} />}
    </div>
  );
});
