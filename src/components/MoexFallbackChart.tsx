import { useEffect, useState, useMemo, memo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, XAxis, ReferenceLine } from "recharts";

interface Candle { date: string; close: number; }
interface Props { ticker: string; height?: number; }

type Range = { label: string; days: number; interval: number; showTime?: boolean; };

const RANGES: Range[] = [
  { label: "1Д", days: 1, interval: 10, showTime: true },
  { label: "5Д", days: 5, interval: 60, showTime: true },
  { label: "1М", days: 30, interval: 24 },
  { label: "3М", days: 90, interval: 24 },
  { label: "6М", days: 180, interval: 24 },
  { label: "1Г", days: 365, interval: 24 },
  { label: "5Л", days: 365 * 5, interval: 7 },
  { label: "Все", days: 365 * 15, interval: 31 },
];

function formatTick(d: string, range: Range) {
  const date = new Date(d);
  if (range.showTime && range.days <= 1)
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (range.showTime) return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
  if (range.days <= 90) return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
  if (range.days <= 365) return date.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
  return date.toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}
function formatTooltipDate(d: string, range: Range) {
  const date = new Date(d);
  if (range.showTime)
    return date.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}
function formatPriceRu(v: number) {
  return v.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CustomTooltip({ active, payload, range }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as Candle;
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5 shadow-md">
      <div className="text-[10.5px] text-muted-foreground mb-0.5">{formatTooltipDate(p.date, range)}</div>
      <div className="text-[12px] font-semibold text-foreground tabular-nums">{formatPriceRu(p.close)} ₽</div>
    </div>
  );
}

function MoexFallbackChart({ ticker, height = 280 }: Props) {
  const [rangeIdx, setRangeIdx] = useState(5);
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const range = RANGES[rangeIdx];

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    const from = new Date();
    from.setDate(from.getDate() - range.days);
    const url = `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${ticker}/candles.json?from=${from.toISOString().slice(0,10)}&interval=${range.interval}`;
    fetch(url).then(r => r.json()).then(json => {
      if (cancelled) return;
      const cols: string[] = json?.candles?.columns || [];
      const ci = cols.indexOf("close"); const bi = cols.indexOf("begin");
      const rows: any[][] = json?.candles?.data || [];
      const parsed = rows.filter(r => r[ci] != null).map(r => ({ date: r[bi], close: Number(r[ci]) }));
      if (!parsed.length) setError("Нет данных");
      setData(parsed);
    }).catch(() => { if (!cancelled) setError("Ошибка загрузки"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticker, rangeIdx]);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const first = data[0].close, last = data[data.length-1].close;
    const diff = last - first; const pct = (diff/first)*100;
    return { last, diff, pct, isPositive: diff >= 0 };
  }, [data]);

  const stroke = (stats?.isPositive ?? true) ? "hsl(160 84% 39%)" : "hsl(0 70% 55%)";
  const fillId = `moex-grad-${ticker}`;
  const { min, max, pad } = useMemo(() => {
    if (!data.length) return { min: 0, max: 0, pad: 1 };
    const mn = Math.min(...data.map(d => d.close)); const mx = Math.max(...data.map(d => d.close));
    return { min: mn, max: mx, pad: (mx-mn)*0.12 || 1 };
  }, [data]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden p-3">
      <div className="flex items-baseline gap-2 mb-2 min-h-[26px]">
        {stats ? (
          <>
            <span className="text-[20px] font-bold text-foreground tabular-nums leading-none">
              {formatPriceRu(stats.last)}<span className="text-[13px] font-medium text-muted-foreground ml-1">₽</span>
            </span>
            <span className={`text-[12.5px] font-semibold tabular-nums ${stats.isPositive ? "text-[hsl(160_84%_39%)]" : "text-[hsl(0_70%_55%)]"}`}>
              {stats.isPositive ? "+" : ""}{formatPriceRu(stats.diff)} ({stats.isPositive ? "+" : ""}{stats.pct.toFixed(2)}%)
            </span>
          </>
        ) : <span className="text-[12px] text-muted-foreground">—</span>}
      </div>
      <div style={{ height }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">Загрузка…</div>
        ) : error || !data.length ? (
          <div className="flex items-center justify-center h-full text-[12px] text-muted-foreground">{error || "Нет данных"}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[min - pad, max + pad]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={44} orientation="right"
                tickFormatter={(v) => v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)}
                axisLine={false} tickLine={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(d) => formatTick(d, range)} minTickGap={50}
                axisLine={false} tickLine={false} />
              {stats && <ReferenceLine y={stats.last} stroke={stroke} strokeDasharray="3 3" strokeOpacity={0.45} />}
              <Tooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={<CustomTooltip range={range} />} />
              <Area type="monotone" dataKey="close" stroke={stroke} strokeWidth={1.8}
                fill={`url(#${fillId})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-border/60">
        {RANGES.map((r, i) => (
          <button key={r.label} onClick={() => setRangeIdx(i)}
            className={`px-2 py-[3px] text-[11px] font-medium rounded transition-colors ${
              i === rangeIdx ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}>{r.label}</button>
        ))}
      </div>
    </div>
  );
}

export default memo(MoexFallbackChart);
