import { X, Search, Check, Newspaper } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Company {
  name: string;
  sector: string;
  ticker: string;
  price: string;
  change: string;
  positive: boolean;
  iconBg: string;
  iconText: string;
  logo?: string;
}

const companies: Company[] = [
  { name: "Алроса", sector: "Металлургия", ticker: "ALRS", price: "38.22 ₽", change: "+0.10%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "АЛ", logo: logoAlrs },
  { name: "Аэрофлот", sector: "Транспорт", ticker: "AFLT", price: "51.28 ₽", change: "+0.08%", positive: true, iconBg: "bg-[#3498DB]", iconText: "АФ", logo: logoAflt },
  { name: "Банк СПб", sector: "Финансы", ticker: "BSPB", price: "332.56 ₽", change: "+0.01%", positive: true, iconBg: "bg-[#8E44AD]", iconText: "B", logo: logoBspb },
  { name: "ВК", sector: "IT", ticker: "VKCO", price: "293.25 ₽", change: "-0.71%", positive: false, iconBg: "bg-[#0077FF]", iconText: "ВК", logo: logoVkco },
  { name: "ВТБ", sector: "Финансы", ticker: "VTBR", price: "86.36 ₽", change: "+0.30%", positive: true, iconBg: "bg-[#009FDF]", iconText: "ВТ", logo: logoVtbr },
  { name: "Газпром", sector: "Нефть и газ", ticker: "GAZP", price: "130.92 ₽", change: "+0.16%", positive: true, iconBg: "bg-[#0D4E96]", iconText: "ГП", logo: logoGazp },
  { name: "Интер РАО", sector: "Энергетика", ticker: "IRAO", price: "3.18 ₽", change: "+0.52%", positive: true, iconBg: "bg-[#F39C12]", iconText: "ИР", logo: logoIrao },
  { name: "ЛСР", sector: "Холдинги", ticker: "LSRG", price: "714.80 ₽", change: "+0.25%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "ЛС", logo: logoLsrg },
  { name: "Лукойл", sector: "Нефть и газ", ticker: "LKOH", price: "5828.00 ₽", change: "+0.59%", positive: true, iconBg: "bg-[#E21A1A]", iconText: "ЛК", logo: logoLkoh },
  { name: "Магнит", sector: "Ритейл", ticker: "MGNT", price: "3171.50 ₽", change: "+0.38%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "МГ", logo: logoMgnt },
  { name: "МД Медикал", sector: "Холдинги", ticker: "MDMG", price: "1413.90 ₽", change: "+0.99%", positive: true, iconBg: "bg-[#1ABC9C]", iconText: "МД", logo: logoMdmg },
  { name: "Мечел", sector: "Металлургия", ticker: "MTLR", price: "73.52 ₽", change: "+0.07%", positive: true, iconBg: "bg-[#2C3E50]", iconText: "МЧ", logo: logoMtlr },
  { name: "МКБ", sector: "Финансы", ticker: "CBOM", price: "5.66 ₽", change: "-0.39%", positive: false, iconBg: "bg-[#27AE60]", iconText: "МК", logo: logoCbom },
  { name: "ММК", sector: "Металлургия", ticker: "MAGN", price: "29.91 ₽", change: "+0.27%", positive: true, iconBg: "bg-[#8E44AD]", iconText: "ММ", logo: logoMagn },
  { name: "Мосбиржа", sector: "Финансы", ticker: "MOEX", price: "174.83 ₽", change: "+0.01%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "МБ", logo: logoMoex },
  { name: "Мосэнерго", sector: "Энергетика", ticker: "MSNG", price: "1726.50 ₽", change: "+0.58%", positive: true, iconBg: "bg-[#3498DB]", iconText: "МЭ", logo: logoMsng },
  { name: "МТС", sector: "Телекоммуникации", ticker: "MTSS", price: "225.45 ₽", change: "+0.07%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "МТ", logo: logoMtss },
  { name: "НЛМК", sector: "Металлургия", ticker: "NLMK", price: "105.84 ₽", change: "-0.09%", positive: false, iconBg: "bg-[#2C3E50]", iconText: "НЛ", logo: logoNlmk },
  { name: "НМТП", sector: "Транспорт", ticker: "NMTP", price: "8.76 ₽", change: "+1.04%", positive: true, iconBg: "bg-[#34495E]", iconText: "НМ", logo: logoNmtp },
  { name: "Новатэк", sector: "Нефть и газ", ticker: "NVTK", price: "1395.00 ₽", change: "+0.61%", positive: true, iconBg: "bg-[#2ECC71]", iconText: "НВ", logo: logoNvtk },
  { name: "Норникель", sector: "Металлургия", ticker: "GMKN", price: "155.70 ₽", change: "+0.53%", positive: true, iconBg: "bg-[#1ABC9C]", iconText: "НН", logo: logoGmkn },
  { name: "Ozon", sector: "Ритейл", ticker: "OZON", price: "4613.50 ₽", change: "+0.03%", positive: true, iconBg: "bg-[#005BFF]", iconText: "OZ", logo: logoOzon },
  { name: "ПИК", sector: "Холдинги", ticker: "PIKK", price: "471.00 ₽", change: "+0.36%", positive: true, iconBg: "bg-[#2C3E50]", iconText: "ПК", logo: logoPikk },
  { name: "Позитив", sector: "IT", ticker: "POSI", price: "1081.20 ₽", change: "+0.20%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "PT", logo: logoPosi },
  { name: "Полюс", sector: "Металлургия", ticker: "PLZL", price: "2425.20 ₽", change: "+0.22%", positive: true, iconBg: "bg-[#F39C12]", iconText: "ПЗ", logo: logoPlzl },
  { name: "Ренессанс", sector: "Финансы", ticker: "RENI", price: "92.76 ₽", change: "+0.13%", positive: true, iconBg: "bg-[#27AE60]", iconText: "РН", logo: logoReni },
  { name: "Роснефть", sector: "Нефть и газ", ticker: "ROSN", price: "503.40 ₽", change: "+0.42%", positive: true, iconBg: "bg-[#F1C40F]", iconText: "РН", logo: logoRosn },
  { name: "Ростелеком", sector: "Телекоммуникации", ticker: "RTKM", price: "60.63 ₽", change: "+0.21%", positive: true, iconBg: "bg-[#8E44AD]", iconText: "РТ", logo: logoRtkm },
  { name: "Русагро", sector: "Холдинги", ticker: "AGRO", price: "116.62 ₽", change: "-0.07%", positive: false, iconBg: "bg-[#27AE60]", iconText: "РА", logo: logoAgro },
  { name: "Русал", sector: "Металлургия", ticker: "RUAL", price: "44.76 ₽", change: "+0.24%", positive: true, iconBg: "bg-[#2C3E50]", iconText: "РС", logo: logoRual },
  { name: "РусГидро", sector: "Энергетика", ticker: "HYDR", price: "0.45 ₽", change: "+0.72%", positive: true, iconBg: "bg-[#3498DB]", iconText: "РГ", logo: logoHydr },
  { name: "РуссНефть", sector: "Нефть и газ", ticker: "RNFT", price: "142.30 ₽", change: "+1.07%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "РН", logo: logoRnft },
  { name: "Самолёт", sector: "Холдинги", ticker: "SMLT", price: "763.60 ₽", change: "-0.60%", positive: false, iconBg: "bg-[#3498DB]", iconText: "СМ", logo: logoSmlt },
  { name: "Сбер-п", sector: "Финансы", ticker: "SBERP", price: "314.21 ₽", change: "-0.11%", positive: false, iconBg: "bg-[#00B956]", iconText: "СП", logo: logoSber },
  { name: "Сбербанк", sector: "Финансы", ticker: "SBER", price: "320.22 ₽", change: "-0.07%", positive: false, iconBg: "bg-[#00B956]", iconText: "СБ", logo: logoSber },
  { name: "Северсталь", sector: "Металлургия", ticker: "CHMF", price: "908.00 ₽", change: "+0.11%", positive: true, iconBg: "bg-[#2C3E50]", iconText: "СС", logo: logoChmf },
  { name: "Сегежа", sector: "Холдинги", ticker: "SGZH", price: "1.25 ₽", change: "+0.36%", positive: true, iconBg: "bg-[#27AE60]", iconText: "СГ", logo: logoSgzh },
  { name: "Селигдар", sector: "Металлургия", ticker: "SELG", price: "57.45 ₽", change: "-0.69%", positive: false, iconBg: "bg-[#8E44AD]", iconText: "СЛ", logo: logoSelg },
  { name: "Система", sector: "Финансы", ticker: "AFKS", price: "13.47 ₽", change: "+0.85%", positive: true, iconBg: "bg-[#3498DB]", iconText: "СС", logo: logoAfks },
  { name: "Совкомбанк", sector: "Финансы", ticker: "SVCB", price: "13.46 ₽", change: "+0.37%", positive: true, iconBg: "bg-[#F39C12]", iconText: "СК", logo: logoSvcb },
  { name: "Совкомфлот", sector: "Транспорт", ticker: "FLOT", price: "90.64 ₽", change: "+0.33%", positive: true, iconBg: "bg-[#2C3E50]", iconText: "СФ", logo: logoFlot },
  { name: "Сургут-п", sector: "Нефть и газ", ticker: "SNGSP", price: "49.16 ₽", change: "+0.33%", positive: true, iconBg: "bg-[#2C3E50]", iconText: "СН", logo: logoSngs },
  { name: "Сургутнефтегаз", sector: "Нефть и газ", ticker: "SNGS", price: "22.71 ₽", change: "-0.09%", positive: false, iconBg: "bg-[#2C3E50]", iconText: "СН", logo: logoSngs },
  { name: "Т-Технологии", sector: "Финансы", ticker: "T", price: "3387.80 ₽", change: "-0.11%", positive: false, iconBg: "bg-[#FFDD2D]", iconText: "Т", logo: logoT },
  { name: "Татнефть", sector: "Нефть и газ", ticker: "TATN", price: "656.60 ₽", change: "+1.25%", positive: true, iconBg: "bg-[#27AE60]", iconText: "ТН", logo: logoTatn },
  { name: "Татнефть-п", sector: "Нефть и газ", ticker: "TATNP", price: "75.50 ₽", change: "+1.75%", positive: true, iconBg: "bg-[#27AE60]", iconText: "ТП", logo: logoTatn },
  { name: "Транснефть-п", sector: "Финансы", ticker: "TRNFP", price: "1412.00 ₽", change: "+0.91%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "ТР", logo: logoTrnfp },
  { name: "ФосАгро", sector: "Химия", ticker: "PHOR", price: "7349.00 ₽", change: "+1.52%", positive: true, iconBg: "bg-[#27AE60]", iconText: "ФА", logo: logoPhor },
  { name: "ФСК ЕЭС", sector: "Энергетика", ticker: "FEES", price: "0.07 ₽", change: "+0.19%", positive: true, iconBg: "bg-[#3498DB]", iconText: "ФС", logo: logoFees },
  { name: "X5 Груп", sector: "Ритейл", ticker: "X5", price: "2430.50 ₽", change: "+0.08%", positive: true, iconBg: "bg-[#27AE60]", iconText: "X5", logo: logoX5 },
  { name: "Хэдхантер", sector: "IT", ticker: "HEAD", price: "1419.10 ₽", change: "+17.89%", positive: true, iconBg: "bg-[#E74C3C]", iconText: "HH", logo: logoHead },
  { name: "ЭН+ ГРУП", sector: "Энергетика", ticker: "ENPG", price: "515.20 ₽", change: "+0.71%", positive: true, iconBg: "bg-[#F39C12]", iconText: "ЭН", logo: logoEnpg },
  { name: "Южуралзолото", sector: "Металлургия", ticker: "UGLD", price: "98.98 ₽", change: "+0.03%", positive: true, iconBg: "bg-[#F39C12]", iconText: "ЮЗ", logo: logoUgld },
  { name: "Юнипро", sector: "Энергетика", ticker: "UPRO", price: "1.54 ₽", change: "-0.49%", positive: false, iconBg: "bg-[#27AE60]", iconText: "ЮП", logo: logoUpro },
  { name: "Яндекс", sector: "IT", ticker: "YDEX", price: "4520.00 ₽", change: "+0.42%", positive: true, iconBg: "bg-[#FC3F1D]", iconText: "Я", logo: logoYdex },
];

interface CompanyFilterModalProps {
  open: boolean;
  onClose: () => void;
}

export function CompanyFilterModal({ open, onClose }: CompanyFilterModalProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ticker.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/25 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-card w-[85%] max-w-[340px] h-full p-5 overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-foreground">Фильтр по компании</h2>
          <button onClick={onClose} className="text-muted-foreground p-1">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по названию или тик"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-[9px] rounded-[12px] border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={() => { setSelected(null); onClose(); }}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-[14px] transition-colors ${!selected ? "bg-accent" : "hover:bg-muted"}`}
        >
          <div className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2EAD6D 0%, #2B7CB5 100%)' }}>
            <Newspaper className="w-[18px] h-[18px] text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-[13.5px] text-foreground">Все новости</p>
            <p className="text-[11px] text-muted-foreground">Показать все компании</p>
          </div>
          {!selected && <Check className="w-[18px] h-[18px] text-primary" />}
        </button>

        <div className="mt-0.5 space-y-0 pb-8">
          {filtered.map((company) => (
            <button
              key={company.ticker}
              onClick={() => { onClose(); navigate(`/emitter/${company.ticker}`); }}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-[14px] transition-colors ${selected === company.ticker ? "bg-accent" : "hover:bg-muted"}`}
            >
              {company.logo ? (
                <div className="w-[38px] h-[38px] min-w-[38px] min-h-[38px] rounded-full bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
                  <img src={company.logo} alt={company.ticker} className="w-[28px] h-[28px] max-w-[28px] max-h-[28px] object-contain" loading="lazy" />
                </div>
              ) : (
                <div className={`w-[38px] h-[38px] rounded-full ${company.iconBg} flex items-center justify-center shrink-0`}>
                  <span className="text-[11px] font-bold text-white">{company.iconText}</span>
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-semibold text-[13.5px] leading-tight text-foreground">{company.name}</p>
                <p className="text-[11px] text-muted-foreground">{company.sector}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">{company.ticker}</span>
                  <span className="text-[11px] text-muted-foreground">{company.price}</span>
                  <span className={`text-[11px] font-medium ${company.positive ? "text-[hsl(var(--news-positive))]" : "text-[hsl(var(--news-negative))]"}`}>
                    ↗ {company.change}
                  </span>
                </div>
              </div>
              {selected === company.ticker && <Check className="w-[18px] h-[18px] text-primary ml-1" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
