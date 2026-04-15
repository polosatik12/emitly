import { useNavigate } from "react-router-dom";
import { getEmitterByTicker } from "@/data/emitters";

interface Props {
  tickers: string[];
}

export function SubscribedEmittersStrip({ tickers }: Props) {
  const navigate = useNavigate();

  if (!tickers.length) return null;

  return (
    <div className="px-4 mb-2">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {tickers.map((ticker) => {
          const emitter = getEmitterByTicker(ticker);
          if (!emitter) return null;
          return (
            <button
              key={ticker}
              onClick={() => navigate(`/emitter/${ticker}`)}
              className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
            >
              <div className="w-[56px] h-[56px] rounded-full p-[2px] bg-gradient-to-br from-primary via-primary/60 to-accent">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden border-2 border-background">
                  <img
                    src={emitter.logo}
                    alt={emitter.name}
                    className="w-[36px] h-[36px] object-contain rounded-full"
                  />
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[60px]">
                {emitter.ticker}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
