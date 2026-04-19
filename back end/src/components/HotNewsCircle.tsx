import { Flame } from "lucide-react";
import type { HotNewsItem } from "@/hooks/useHotNews";
import { getEmitterByTicker } from "@/data/emitters";
import { useReadHotNews } from "@/hooks/useReadHotNews";

interface Props {
  item: HotNewsItem;
  size?: "sm" | "md";
  /** Компактный режим: маленький кружок без подписи (для шапки) */
  compact?: boolean;
  onClick: () => void;
}

/**
 * Кружок «горячей» новости — лого тикера + бейдж 🔥.
 * После прочтения становится серым (приглушённым).
 */
export function HotNewsCircle({ item, size = "sm", compact = false, onClick }: Props) {
  const emitter = getEmitterByTicker(item.news.ticker);
  const { isRead } = useReadHotNews();
  const read = isRead(item.news.id);

  if (compact) {
    const ringGradient = read
      ? "bg-gradient-to-br from-muted-foreground/40 via-muted-foreground/30 to-muted-foreground/40"
      : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500";
    const badgeGradient = read
      ? "bg-muted-foreground/60"
      : "bg-gradient-to-br from-orange-400 to-red-600";

    return (
      <button
        onClick={onClick}
        className="shrink-0 active:scale-95 transition-transform"
        aria-label={`Горячая новость: ${item.news.ticker}${read ? " (прочитано)" : ""}`}
      >
        <div className={`w-9 h-9 relative rounded-full p-[1.5px] ${ringGradient} transition-colors duration-300`}>
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border border-background">
            {emitter ? (
              <img
                src={emitter.logo}
                alt={item.news.ticker}
                className={`w-[70%] h-[70%] object-contain rounded-full ${read ? "grayscale opacity-60" : ""}`}
              />
            ) : (
              <span className="text-[8px] font-bold text-foreground">{item.news.ticker.slice(0, 4)}</span>
            )}
          </div>
          <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${badgeGradient} flex items-center justify-center border border-background shadow-sm`}>
            <Flame className="w-2 h-2 text-white" strokeWidth={2.5} fill="white" />
          </div>
        </div>
      </button>
    );
  }

  const ringSize = size === "md" ? "w-[48px] h-[48px]" : "w-[44px] h-[44px]";
  const labelSize = size === "md" ? "text-[10px]" : "text-[9px]";

  const ringGradient = read
    ? "bg-gradient-to-br from-muted-foreground/40 via-muted-foreground/30 to-muted-foreground/40"
    : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500";

  const badgeGradient = read
    ? "bg-muted-foreground/60"
    : "bg-gradient-to-br from-orange-400 to-red-600";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
      aria-label={`Горячая новость: ${item.news.ticker}${read ? " (прочитано)" : ""}`}
    >
      <div className={`${ringSize} relative rounded-full p-[2px] ${ringGradient} transition-colors duration-300`}>
        <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background">
          {emitter ? (
            <img
              src={emitter.logo}
              alt={item.news.ticker}
              className={`w-[70%] h-[70%] object-contain rounded-full transition-all duration-300 ${read ? "grayscale opacity-60" : ""}`}
            />
          ) : (
            <span className="text-[10px] font-bold text-foreground">{item.news.ticker.slice(0, 4)}</span>
          )}
        </div>
        <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full ${badgeGradient} flex items-center justify-center border border-background shadow-sm transition-colors duration-300`}>
          <Flame className="w-2.5 h-2.5 text-white" strokeWidth={2.5} fill="white" />
        </div>
      </div>
      <span className={`${labelSize} font-semibold ${read ? "text-muted-foreground" : "text-foreground"} truncate max-w-[60px] transition-colors duration-300`}>
        {item.news.ticker}
      </span>
    </button>
  );
}
