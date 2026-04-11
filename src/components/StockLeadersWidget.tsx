import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import RequisitesModal from "@/components/RequisitesModal";
import { downloadFile } from "@/lib/download";

// All emitters sorted by change% descending (leaders first)
import logoSber from "@/assets/logo-sber.jpg";
import logoSmlt from "@/assets/logo-smlt.png";
import logoPosi from "@/assets/logo-posi.png";
import logoGazp from "@/assets/logo-gazp.png";
import logoLkoh from "@/assets/logo-lkoh.png";
import logoOzon from "@/assets/logo-ozon.png";
import logoAlrs from "@/assets/logo-alrs.png";
import logoAflt from "@/assets/logo-aflt.png";
import logoBspb from "@/assets/logo-bspb.png";
import logoVkco from "@/assets/logo-vkco.png";
import logoVtbr from "@/assets/logo-vtbr.png";
import logoIrao from "@/assets/logo-irao.png";
import logoLsrg from "@/assets/logo-lsrg.png";
import logoMgnt from "@/assets/logo-mgnt.png";
import logoMdmg from "@/assets/logo-mdmg.png";
import logoMtlr from "@/assets/logo-mtlr.png";
import logoCbom from "@/assets/logo-cbom.png";
import logoMagn from "@/assets/logo-magn.png";
import logoMoex from "@/assets/logo-moex.png";
import logoMsng from "@/assets/logo-msng.png";
import logoMtss from "@/assets/logo-mtss.png";
import logoNlmk from "@/assets/logo-nlmk.png";
import logoNmtp from "@/assets/logo-nmtp.png";
import logoNvtk from "@/assets/logo-nvtk.png";
import logoGmkn from "@/assets/logo-gmkn.png";
import logoPikk from "@/assets/logo-pikk.png";
import logoPlzl from "@/assets/logo-plzl.png";
import logoReni from "@/assets/logo-reni.png";
import logoRosn from "@/assets/logo-rosn.png";
import logoRtkm from "@/assets/logo-rtkm.png";
import logoAgro from "@/assets/logo-agro.png";
import logoRual from "@/assets/logo-rual.png";
import logoHydr from "@/assets/logo-hydr.png";
import logoRnft from "@/assets/logo-rnft.png";
import logoChmf from "@/assets/logo-chmf.png";
import logoSgzh from "@/assets/logo-sgzh.png";
import logoSelg from "@/assets/logo-selg.png";
import logoAfks from "@/assets/logo-afks.png";
import logoSvcb from "@/assets/logo-svcb.png";
import logoFlot from "@/assets/logo-flot.png";
import logoSngs from "@/assets/logo-sngs.png";
import logoT from "@/assets/logo-t.png";
import logoTatn from "@/assets/logo-tatn.png";
import logoTrnfp from "@/assets/logo-trnfp.png";
import logoPhor from "@/assets/logo-phor.png";
import logoFees from "@/assets/logo-fees.png";
import logoX5 from "@/assets/logo-x5.png";
import logoHead from "@/assets/logo-head.png";
import logoEnpg from "@/assets/logo-enpg.png";
import logoUgld from "@/assets/logo-ugld.png";
import logoUpro from "@/assets/logo-upro.png";
import logoYdex from "@/assets/logo-ydex.png";

interface Emitter {
  name: string;
  ticker: string;
  price: string;
  changePercent: number;
  logo: string;
}

const allEmitters: Emitter[] = [
  { name: "Хэдхантер", ticker: "HEAD", price: "1419.10 ₽", changePercent: 17.89, logo: logoHead },
  { name: "Татнефть-п", ticker: "TATNP", price: "75.50 ₽", changePercent: 1.75, logo: logoTatn },
  { name: "ФосАгро", ticker: "PHOR", price: "7349.00 ₽", changePercent: 1.52, logo: logoPhor },
  { name: "Татнефть", ticker: "TATN", price: "656.60 ₽", changePercent: 1.25, logo: logoTatn },
  { name: "РуссНефть", ticker: "RNFT", price: "142.30 ₽", changePercent: 1.07, logo: logoRnft },
  { name: "НМТП", ticker: "NMTP", price: "8.76 ₽", changePercent: 1.04, logo: logoNmtp },
  { name: "МД Медикал", ticker: "MDMG", price: "1413.90 ₽", changePercent: 0.99, logo: logoMdmg },
  { name: "Транснефть-п", ticker: "TRNFP", price: "1412.00 ₽", changePercent: 0.91, logo: logoTrnfp },
  { name: "Система", ticker: "AFKS", price: "13.47 ₽", changePercent: 0.85, logo: logoAfks },
  { name: "РусГидро", ticker: "HYDR", price: "0.45 ₽", changePercent: 0.72, logo: logoHydr },
  { name: "ЭН+ ГРУП", ticker: "ENPG", price: "515.20 ₽", changePercent: 0.71, logo: logoEnpg },
  { name: "Новатэк", ticker: "NVTK", price: "1395.00 ₽", changePercent: 0.61, logo: logoNvtk },
  { name: "Лукойл", ticker: "LKOH", price: "5828.00 ₽", changePercent: 0.59, logo: logoLkoh },
  { name: "Мосэнерго", ticker: "MSNG", price: "1726.50 ₽", changePercent: 0.58, logo: logoMsng },
  { name: "Норникель", ticker: "GMKN", price: "155.70 ₽", changePercent: 0.53, logo: logoGmkn },
  { name: "Интер РАО", ticker: "IRAO", price: "3.18 ₽", changePercent: 0.52, logo: logoIrao },
  { name: "Яндекс", ticker: "YDEX", price: "4520.00 ₽", changePercent: 0.42, logo: logoYdex },
  { name: "Роснефть", ticker: "ROSN", price: "503.40 ₽", changePercent: 0.42, logo: logoRosn },
  { name: "Магнит", ticker: "MGNT", price: "3171.50 ₽", changePercent: 0.38, logo: logoMgnt },
  { name: "Совкомбанк", ticker: "SVCB", price: "13.46 ₽", changePercent: 0.37, logo: logoSvcb },
  { name: "Сегежа", ticker: "SGZH", price: "1.25 ₽", changePercent: 0.36, logo: logoSgzh },
  { name: "ПИК", ticker: "PIKK", price: "471.00 ₽", changePercent: 0.36, logo: logoPikk },
  { name: "Совкомфлот", ticker: "FLOT", price: "90.64 ₽", changePercent: 0.33, logo: logoFlot },
  { name: "Сургут-п", ticker: "SNGSP", price: "49.16 ₽", changePercent: 0.33, logo: logoSngs },
  { name: "ВТБ", ticker: "VTBR", price: "86.36 ₽", changePercent: 0.30, logo: logoVtbr },
  { name: "ММК", ticker: "MAGN", price: "29.91 ₽", changePercent: 0.27, logo: logoMagn },
  { name: "ЛСР", ticker: "LSRG", price: "714.80 ₽", changePercent: 0.25, logo: logoLsrg },
  { name: "Русал", ticker: "RUAL", price: "44.76 ₽", changePercent: 0.24, logo: logoRual },
  { name: "Полюс", ticker: "PLZL", price: "2425.20 ₽", changePercent: 0.22, logo: logoPlzl },
  { name: "Ростелеком", ticker: "RTKM", price: "60.63 ₽", changePercent: 0.21, logo: logoRtkm },
  { name: "Позитив", ticker: "POSI", price: "1081.20 ₽", changePercent: 0.20, logo: logoPosi },
  { name: "ФСК ЕЭС", ticker: "FEES", price: "0.07 ₽", changePercent: 0.19, logo: logoFees },
  { name: "Газпром", ticker: "GAZP", price: "130.92 ₽", changePercent: 0.16, logo: logoGazp },
  { name: "Ренессанс", ticker: "RENI", price: "92.76 ₽", changePercent: 0.13, logo: logoReni },
  { name: "Северсталь", ticker: "CHMF", price: "908.00 ₽", changePercent: 0.11, logo: logoChmf },
  { name: "Алроса", ticker: "ALRS", price: "38.22 ₽", changePercent: 0.10, logo: logoAlrs },
  { name: "X5 Груп", ticker: "X5", price: "2430.50 ₽", changePercent: 0.08, logo: logoX5 },
  { name: "Аэрофлот", ticker: "AFLT", price: "51.28 ₽", changePercent: 0.08, logo: logoAflt },
  { name: "МТС", ticker: "MTSS", price: "225.45 ₽", changePercent: 0.07, logo: logoMtss },
  { name: "Мечел", ticker: "MTLR", price: "73.52 ₽", changePercent: 0.07, logo: logoMtlr },
  { name: "Южуралзолото", ticker: "UGLD", price: "98.98 ₽", changePercent: 0.03, logo: logoUgld },
  { name: "Ozon", ticker: "OZON", price: "4613.50 ₽", changePercent: 0.03, logo: logoOzon },
  { name: "Мосбиржа", ticker: "MOEX", price: "174.83 ₽", changePercent: 0.01, logo: logoMoex },
  { name: "Банк СПб", ticker: "BSPB", price: "332.56 ₽", changePercent: 0.01, logo: logoBspb },
  { name: "Русагро", ticker: "AGRO", price: "116.62 ₽", changePercent: -0.07, logo: logoAgro },
  { name: "Сбербанк", ticker: "SBER", price: "320.22 ₽", changePercent: -0.07, logo: logoSber },
  { name: "НЛМК", ticker: "NLMK", price: "105.84 ₽", changePercent: -0.09, logo: logoNlmk },
  { name: "Сургутнефтегаз", ticker: "SNGS", price: "22.71 ₽", changePercent: -0.09, logo: logoSngs },
  { name: "Сбер-п", ticker: "SBERP", price: "314.21 ₽", changePercent: -0.11, logo: logoSber },
  { name: "Т-Технологии", ticker: "T", price: "3387.80 ₽", changePercent: -0.11, logo: logoT },
  { name: "МКБ", ticker: "CBOM", price: "5.66 ₽", changePercent: -0.39, logo: logoCbom },
  { name: "Юнипро", ticker: "UPRO", price: "1.54 ₽", changePercent: -0.49, logo: logoUpro },
  { name: "Самолёт", ticker: "SMLT", price: "763.60 ₽", changePercent: -0.60, logo: logoSmlt },
  { name: "Селигдар", ticker: "SELG", price: "57.45 ₽", changePercent: -0.69, logo: logoSelg },
  { name: "ВК", ticker: "VKCO", price: "293.25 ₽", changePercent: -0.71, logo: logoVkco },
];

const INITIAL_COUNT = 5;

export default function StockLeadersWidget() {
  const navigate = useNavigate();
  const [showRequisites, setShowRequisites] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const visibleEmitters = expanded ? allEmitters : allEmitters.slice(0, INITIAL_COUNT);

  return (
    <aside className="w-[300px] shrink-0 sticky top-0 overflow-y-auto max-h-screen pt-6 pr-4 pb-4">
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
          <h2 className="text-[16px] font-bold text-foreground">Лидеры роста</h2>
        </div>

        {/* Leaders list */}
        <div className="space-y-1">
          {visibleEmitters.map((item, index) => (
            <div
              key={item.ticker}
              onClick={() => navigate(`/emitter/${item.ticker}`)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <span className="text-[13px] text-muted-foreground font-medium w-4 shrink-0">{index + 1}</span>
              <img
                src={item.logo}
                alt={item.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">{item.ticker}</p>
                <p className="text-[12px] text-muted-foreground truncate">{item.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-foreground">{item.price}</p>
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
            <span className="hover:text-foreground cursor-pointer">Поддержка</span>
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
