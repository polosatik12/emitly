import { useEffect, useRef, memo } from "react";

interface Props {
  ticker: string;
  height?: number;
}

/**
 * Официальный TradingView Advanced Chart виджет.
 * Документация: https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/
 *
 * Для российских акций используется префикс MOEX: (например MOEX:SBER, MOEX:RNFT).
 * Виджет полноценный — со свечами, переключателями таймфреймов, инструментами анализа.
 */
function TradingViewChart({ ticker, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `RUS:${ticker.toUpperCase()}`,
      interval: "D",
      timezone: "Europe/Moscow",
      theme: "light",
      style: "3", // 3 = area chart (как на скриншоте TV)
      locale: "ru",
      backgroundColor: "rgba(255, 255, 255, 1)",
      gridColor: "rgba(240, 243, 250, 0.6)",
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
      withdateranges: true,
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [ticker]);

  return (
    <div
      className="bg-card rounded-xl border border-border overflow-hidden"
      style={{ height }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}

export default memo(TradingViewChart);
