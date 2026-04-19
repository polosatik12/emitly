import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign } from "lucide-react";
import RequisitesModal from "@/components/RequisitesModal";
import { downloadFile } from "@/lib/download";
import { emitters } from "@/data/emitters";
import { useMoexPrices, formatPrice } from "@/hooks/useMoexPrices";

const CURRENCY_CONFIG = [
  { key: "USD", label: "Доллар", suffix: "₽" },
  { key: "EUR", label: "Евро", suffix: "₽" },
  { key: "CNY", label: "Юань", suffix: "₽" },
  { key: "XAU", label: "Золото", suffix: "₽" },
  { key: "XAG", label: "Серебро", suffix: "₽" },
];

const INITIAL_COUNT = 5;

export default function StockLeadersWidget() {
  const navigate = useNavigate();
  const [showRequisites, setShowRequisites] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { prices, currencies } = useMoexPrices();

  // Build live emitter list sorted by changePercent descending
  const liveEmitters = emitters
    .map((e) => {
      const live = prices[e.ticker];
      return {
        name: e.name,
        ticker: e.ticker,
        logo: e.logo,
        price: live ? formatPrice(live.price) : e.price,
        changePercent: live ? live.changePercent : e.changePercent,
      };
    })
    .sort((a, b) => b.changePercent - a.changePercent);

  const visibleEmitters = expanded ? liveEmitters : liveEmitters.slice(0, INITIAL_COUNT);

  return (
    <aside className="w-[340px] shrink-0 sticky top-0 overflow-y-auto max-h-screen pt-6 pr-4 pb-4">
      {/* Currency & Commodities */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" strokeWidth={2} />
          <h2 className="text-[16px] font-bold text-foreground">Курсы валют</h2>
        </div>
        <div className="space-y-2.5">
          {CURRENCY_CONFIG.map((cfg) => {
            const live = currencies[cfg.key];
            const priceStr = live ? formatPrice(live.price) : "—";
            const changePct = live ? live.changePercent : 0;
            return (
              <div key={cfg.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <span className="text-[14px] font-bold text-foreground">{cfg.key}</span>
                  <span className="text-[12px] text-muted-foreground ml-2">{cfg.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-semibold text-foreground">{priceStr}</span>
                  <span className={`text-[12px] font-medium ml-2 ${changePct >= 0 ? "text-primary" : "text-destructive"}`}>
                    {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Leaders */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
          <h2 className="text-[16px] font-bold text-foreground">Лидеры роста</h2>
        </div>

        <div className="space-y-1">
          {visibleEmitters.map((item, index) => (
            <div
              key={item.ticker}
              onClick={() => navigate(`/emitter/${item.ticker}`)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <span className="text-[13px] text-muted-foreground font-medium w-5 shrink-0">{index + 1}</span>
              <img src={item.logo} alt={item.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">{item.ticker}</p>
                <p className="text-[12px] text-muted-foreground truncate">{item.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[14px] font-semibold text-foreground">{item.price}</p>
                <p className={`text-[12px] font-medium ${item.changePercent >= 0 ? "text-primary" : "text-destructive"}`}>
                  {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-[13px] font-medium text-primary hover:underline"
        >
          {expanded ? "Свернуть" : "Показать ещё"}
        </button>

        {/* Footer links */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span onClick={() => downloadFile("/docs/user-agreement.docx", "Пользовательское_соглашение.docx")} className="hover:text-foreground cursor-pointer">Пользовательское соглашение</span>
            <span onClick={() => downloadFile("/docs/privacy-policy.docx", "Политика_обработки_данных.docx")} className="hover:text-foreground cursor-pointer">Конфиденциальность</span>
            <span onClick={() => window.open("mailto:support@emitly.ru", "_blank")} className="hover:text-foreground cursor-pointer">Поддержка</span>
            <span onClick={() => navigate("/service-catalog")} className="hover:text-foreground cursor-pointer">Каталог услуг</span>
            <span onClick={() => setShowRequisites(true)} className="hover:text-foreground cursor-pointer">Реквизиты</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">© 2026 Emitly</p>
        </div>
      </div>
      <RequisitesModal open={showRequisites} onClose={() => setShowRequisites(false)} />
    </aside>
  );
}
