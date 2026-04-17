import { useNavigate } from "react-router-dom";
import { getEmitterByTicker } from "@/data/emitters";
import { GreenlandCircle } from "@/components/GreenlandCircle";
import { HotNewsCircle } from "@/components/HotNewsCircle";
import { useNews, type NewsItem } from "@/hooks/useNews";
import { useHotNews } from "@/hooks/useHotNews";

interface Props {
  tickers: string[];
  onSelectNews?: (news: NewsItem) => void;
  /** Компактный режим — для встраивания в шапку (меньшие кружки, без подписей и без внешних отступов) */
  compact?: boolean;
}

export function SubscribedEmittersStrip({ tickers, onSelectNews, compact = false }: Props) {
  const navigate = useNavigate();
  const { news } = useNews();
  const hot = useHotNews(news);

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <GreenlandCircle compact />
        {hot.map((item) => (
          <HotNewsCircle
            key={item.news.id}
            item={item}
            compact
            onClick={() => onSelectNews?.(item.news)}
          />
        ))}
        {tickers.map((ticker) => {
          const emitter = getEmitterByTicker(ticker);
          if (!emitter) return null;
          return (
            <button
              key={ticker}
              onClick={() => navigate(`/emitter/${ticker}`)}
              className="shrink-0 active:scale-95 transition-transform"
              aria-label={emitter.name}
            >
              <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-br from-primary via-primary to-primary/80">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border border-background">
                  <img
                    src={emitter.logo}
                    alt={emitter.name}
                    className="w-[22px] h-[22px] object-contain rounded-full"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-4 mb-2">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        <GreenlandCircle />
        {hot.map((item) => (
          <HotNewsCircle
            key={item.news.id}
            item={item}
            onClick={() => onSelectNews?.(item.news)}
          />
        ))}
        {tickers.map((ticker) => {
          const emitter = getEmitterByTicker(ticker);
          if (!emitter) return null;
          return (
            <button
              key={ticker}
              onClick={() => navigate(`/emitter/${ticker}`)}
              className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
            >
              <div className="w-[44px] h-[44px] rounded-full p-[2.5px] bg-gradient-to-br from-primary via-primary to-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.35)]">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background">
                  <img
                    src={emitter.logo}
                    alt={emitter.name}
                    className="w-[28px] h-[28px] object-contain rounded-full"
                  />
                </div>
              </div>
              <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[60px]">
                {emitter.ticker}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
