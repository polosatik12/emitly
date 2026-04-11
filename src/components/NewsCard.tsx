import { Clock, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import logoSber from "@/assets/logo-sber.jpg";
import logoSmlt from "@/assets/logo-smlt.png";
import logoPosi from "@/assets/logo-posi.png";
import logoGazp from "@/assets/logo-gazp.png";
import logoLkoh from "@/assets/logo-lkoh.png";

interface NewsCardProps {
  id: string;
  ticker: string;
  category: string;
  date: string;
  title: string;
  bullPercent?: number;
  bearPercent?: number;
  comments?: number;
  onClick?: () => void;
}

const categoryBottomColors: Record<string, string> = {
  "Событие": "#00B856",
  "Сделка": "#E67E22",
  "Собрание": "#E74C3C",
  "Дивиденды": "#00B856",
  "Отчёты": "#3498DB",
};

const tickerLogos: Record<string, string> = {
  "SBER": logoSber,
  "SMLT": logoSmlt,
  "POSI": logoPosi,
  "GAZP": logoGazp,
  "LKOH": logoLkoh,
};

export function NewsCard({ id, ticker, category, date, title, bullPercent = 50, bearPercent = 50, comments = 4, onClick }: NewsCardProps) {
  const bottomColor = categoryBottomColors[category] || "#BDC3C7";
  const logo = tickerLogos[ticker];

  return (
    <div className="bg-card rounded-[16px] card-shadow border border-border overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="px-3.5 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {logo ? (
              <div className="w-[26px] h-[26px] rounded-full bg-card border border-border flex items-center justify-center shrink-0 overflow-hidden">
                <img src={logo} alt={ticker} className="w-[20px] h-[20px] object-contain" />
              </div>
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

        {/* Title */}
        <p className="text-[13px] text-foreground leading-[1.42] mb-2.5 pr-2">{title}</p>

        {/* Sentiment bar row */}
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

      {/* Bottom colored bar */}
      <div className="h-[3px] w-full" style={{ backgroundColor: bottomColor }} />
    </div>
  );
}
