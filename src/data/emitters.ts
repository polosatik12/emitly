// Shared emitter data used across the app
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

export interface EmitterData {
  name: string;
  ticker: string;
  sector: string;
  price: string;
  changePercent: number;
  logo: string;
  analytics: {
    pe: string;
    pb: string;
    evEbitda: string;
    ndEbitda: string;
  };
}

export const emitters: EmitterData[] = [
  { name: "Алроса", ticker: "ALRS", sector: "Металлургия", price: "38.22 ₽", changePercent: 0.10, logo: logoAlrs, analytics: { pe: "5.8", pb: "0.72", evEbitda: "3.1", ndEbitda: "0.2" } },
  { name: "Аэрофлот", ticker: "AFLT", sector: "Транспорт", price: "51.28 ₽", changePercent: 0.08, logo: logoAflt, analytics: { pe: "—", pb: "—", evEbitda: "6.8", ndEbitda: "3.5" } },
  { name: "Банк СПб", ticker: "BSPB", sector: "Финансы", price: "332.56 ₽", changePercent: 0.01, logo: logoBspb, analytics: { pe: "3.2", pb: "0.58", evEbitda: "—", ndEbitda: "—" } },
  { name: "ВК", ticker: "VKCO", sector: "IT", price: "293.25 ₽", changePercent: -0.71, logo: logoVkco, analytics: { pe: "—", pb: "2.10", evEbitda: "12.4", ndEbitda: "1.8" } },
  { name: "ВТБ", ticker: "VTBR", sector: "Финансы", price: "86.36 ₽", changePercent: 0.30, logo: logoVtbr, analytics: { pe: "2.1", pb: "0.35", evEbitda: "—", ndEbitda: "—" } },
  { name: "Газпром", ticker: "GAZP", sector: "Нефть и газ", price: "130.92 ₽", changePercent: 0.16, logo: logoGazp, analytics: { pe: "3.5", pb: "0.28", evEbitda: "2.9", ndEbitda: "1.1" } },
  { name: "Интер РАО", ticker: "IRAO", sector: "Энергетика", price: "3.18 ₽", changePercent: 0.52, logo: logoIrao, analytics: { pe: "4.1", pb: "0.45", evEbitda: "2.5", ndEbitda: "-0.8" } },
  { name: "ЛСР", ticker: "LSRG", sector: "Холдинги", price: "714.80 ₽", changePercent: 0.25, logo: logoLsrg, analytics: { pe: "5.2", pb: "0.68", evEbitda: "4.1", ndEbitda: "1.2" } },
  { name: "Лукойл", ticker: "LKOH", sector: "Нефть и газ", price: "5828.00 ₽", changePercent: 0.59, logo: logoLkoh, analytics: { pe: "4.8", pb: "0.95", evEbitda: "2.7", ndEbitda: "-0.3" } },
  { name: "Магнит", ticker: "MGNT", sector: "Ритейл", price: "3171.50 ₽", changePercent: 0.38, logo: logoMgnt, analytics: { pe: "8.2", pb: "2.15", evEbitda: "5.3", ndEbitda: "1.5" } },
  { name: "МД Медикал", ticker: "MDMG", sector: "Холдинги", price: "1413.90 ₽", changePercent: 0.99, logo: logoMdmg, analytics: { pe: "12.5", pb: "3.40", evEbitda: "8.1", ndEbitda: "0.5" } },
  { name: "Мечел", ticker: "MTLR", sector: "Металлургия", price: "73.52 ₽", changePercent: 0.07, logo: logoMtlr, analytics: { pe: "—", pb: "—", evEbitda: "5.9", ndEbitda: "4.2" } },
  { name: "МКБ", ticker: "CBOM", sector: "Финансы", price: "5.66 ₽", changePercent: -0.39, logo: logoCbom, analytics: { pe: "3.8", pb: "0.52", evEbitda: "—", ndEbitda: "—" } },
  { name: "ММК", ticker: "MAGN", sector: "Металлургия", price: "29.91 ₽", changePercent: 0.27, logo: logoMagn, analytics: { pe: "6.1", pb: "0.78", evEbitda: "3.4", ndEbitda: "-0.1" } },
  { name: "Мосбиржа", ticker: "MOEX", sector: "Финансы", price: "174.83 ₽", changePercent: 0.01, logo: logoMoex, analytics: { pe: "7.3", pb: "2.80", evEbitda: "—", ndEbitda: "—" } },
  { name: "Мосэнерго", ticker: "MSNG", sector: "Энергетика", price: "1726.50 ₽", changePercent: 0.58, logo: logoMsng, analytics: { pe: "5.0", pb: "0.38", evEbitda: "3.0", ndEbitda: "0.1" } },
  { name: "МТС", ticker: "MTSS", sector: "Телекоммуникации", price: "225.45 ₽", changePercent: 0.07, logo: logoMtss, analytics: { pe: "9.4", pb: "4.50", evEbitda: "4.2", ndEbitda: "2.1" } },
  { name: "НЛМК", ticker: "NLMK", sector: "Металлургия", price: "105.84 ₽", changePercent: -0.09, logo: logoNlmk, analytics: { pe: "5.5", pb: "1.10", evEbitda: "3.8", ndEbitda: "0.3" } },
  { name: "НМТП", ticker: "NMTP", sector: "Транспорт", price: "8.76 ₽", changePercent: 1.04, logo: logoNmtp, analytics: { pe: "4.2", pb: "1.25", evEbitda: "5.1", ndEbitda: "0.8" } },
  { name: "Новатэк", ticker: "NVTK", sector: "Нефть и газ", price: "1395.00 ₽", changePercent: 0.61, logo: logoNvtk, analytics: { pe: "7.8", pb: "1.85", evEbitda: "5.2", ndEbitda: "0.4" } },
  { name: "Норникель", ticker: "GMKN", sector: "Металлургия", price: "155.70 ₽", changePercent: 0.53, logo: logoGmkn, analytics: { pe: "6.9", pb: "3.20", evEbitda: "4.5", ndEbitda: "1.0" } },
  { name: "Ozon", ticker: "OZON", sector: "Ритейл", price: "4613.50 ₽", changePercent: 0.03, logo: logoOzon, analytics: { pe: "—", pb: "5.60", evEbitda: "—", ndEbitda: "0.9" } },
  { name: "ПИК", ticker: "PIKK", sector: "Холдинги", price: "471.00 ₽", changePercent: 0.36, logo: logoPikk, analytics: { pe: "4.5", pb: "0.55", evEbitda: "4.8", ndEbitda: "2.3" } },
  { name: "Позитив", ticker: "POSI", sector: "IT", price: "1081.20 ₽", changePercent: 0.20, logo: logoPosi, analytics: { pe: "15.2", pb: "8.90", evEbitda: "12.0", ndEbitda: "-0.5" } },
  { name: "Полюс", ticker: "PLZL", sector: "Металлургия", price: "2425.20 ₽", changePercent: 0.22, logo: logoPlzl, analytics: { pe: "8.1", pb: "4.10", evEbitda: "5.8", ndEbitda: "1.2" } },
  { name: "Ренессанс", ticker: "RENI", sector: "Финансы", price: "92.76 ₽", changePercent: 0.13, logo: logoReni, analytics: { pe: "4.8", pb: "0.90", evEbitda: "—", ndEbitda: "—" } },
  { name: "Роснефть", ticker: "ROSN", sector: "Нефть и газ", price: "503.40 ₽", changePercent: 0.42, logo: logoRosn, analytics: { pe: "3.9", pb: "0.62", evEbitda: "3.1", ndEbitda: "1.4" } },
  { name: "Ростелеком", ticker: "RTKM", sector: "Телекоммуникации", price: "60.63 ₽", changePercent: 0.21, logo: logoRtkm, analytics: { pe: "8.7", pb: "1.35", evEbitda: "3.9", ndEbitda: "2.0" } },
  { name: "Русагро", ticker: "AGRO", sector: "Холдинги", price: "116.62 ₽", changePercent: -0.07, logo: logoAgro, analytics: { pe: "4.0", pb: "0.75", evEbitda: "3.5", ndEbitda: "1.1" } },
  { name: "Русал", ticker: "RUAL", sector: "Металлургия", price: "44.76 ₽", changePercent: 0.24, logo: logoRual, analytics: { pe: "—", pb: "0.65", evEbitda: "7.2", ndEbitda: "2.8" } },
  { name: "РусГидро", ticker: "HYDR", sector: "Энергетика", price: "0.45 ₽", changePercent: 0.72, logo: logoHydr, analytics: { pe: "3.8", pb: "0.30", evEbitda: "3.2", ndEbitda: "1.5" } },
  { name: "РуссНефть", ticker: "RNFT", sector: "Нефть и газ", price: "142.30 ₽", changePercent: 1.07, logo: logoRnft, analytics: { pe: "2.9", pb: "0.40", evEbitda: "2.1", ndEbitda: "0.9" } },
  { name: "Самолёт", ticker: "SMLT", sector: "Холдинги", price: "763.60 ₽", changePercent: -0.60, logo: logoSmlt, analytics: { pe: "3.1", pb: "0.48", evEbitda: "5.5", ndEbitda: "3.8" } },
  { name: "Сбер-п", ticker: "SBERP", sector: "Финансы", price: "314.21 ₽", changePercent: -0.11, logo: logoSber, analytics: { pe: "4.2", pb: "0.90", evEbitda: "—", ndEbitda: "—" } },
  { name: "Сбербанк", ticker: "SBER", sector: "Финансы", price: "320.22 ₽", changePercent: -0.07, logo: logoSber, analytics: { pe: "4.2", pb: "0.90", evEbitda: "—", ndEbitda: "—" } },
  { name: "Северсталь", ticker: "CHMF", sector: "Металлургия", price: "908.00 ₽", changePercent: 0.11, logo: logoChmf, analytics: { pe: "5.0", pb: "1.50", evEbitda: "3.2", ndEbitda: "-0.2" } },
  { name: "Сегежа", ticker: "SGZH", sector: "Холдинги", price: "1.25 ₽", changePercent: 0.36, logo: logoSgzh, analytics: { pe: "—", pb: "—", evEbitda: "12.5", ndEbitda: "6.1" } },
  { name: "Селигдар", ticker: "SELG", sector: "Металлургия", price: "57.45 ₽", changePercent: -0.69, logo: logoSelg, analytics: { pe: "7.5", pb: "1.20", evEbitda: "5.0", ndEbitda: "2.2" } },
  { name: "Система", ticker: "AFKS", sector: "Финансы", price: "13.47 ₽", changePercent: 0.85, logo: logoAfks, analytics: { pe: "—", pb: "0.48", evEbitda: "6.5", ndEbitda: "4.0" } },
  { name: "Совкомбанк", ticker: "SVCB", sector: "Финансы", price: "13.46 ₽", changePercent: 0.37, logo: logoSvcb, analytics: { pe: "2.8", pb: "0.65", evEbitda: "—", ndEbitda: "—" } },
  { name: "Совкомфлот", ticker: "FLOT", sector: "Транспорт", price: "90.64 ₽", changePercent: 0.33, logo: logoFlot, analytics: { pe: "3.5", pb: "0.55", evEbitda: "4.0", ndEbitda: "1.8" } },
  { name: "Сургут-п", ticker: "SNGSP", sector: "Нефть и газ", price: "49.16 ₽", changePercent: 0.33, logo: logoSngs, analytics: { pe: "2.5", pb: "0.22", evEbitda: "1.8", ndEbitda: "-1.5" } },
  { name: "Сургутнефтегаз", ticker: "SNGS", sector: "Нефть и газ", price: "22.71 ₽", changePercent: -0.09, logo: logoSngs, analytics: { pe: "2.5", pb: "0.22", evEbitda: "1.8", ndEbitda: "-1.5" } },
  { name: "Т-Технологии", ticker: "T", sector: "Финансы", price: "3387.80 ₽", changePercent: -0.11, logo: logoT, analytics: { pe: "6.5", pb: "2.10", evEbitda: "—", ndEbitda: "—" } },
  { name: "Татнефть", ticker: "TATN", sector: "Нефть и газ", price: "656.60 ₽", changePercent: 1.25, logo: logoTatn, analytics: { pe: "4.5", pb: "0.85", evEbitda: "2.8", ndEbitda: "0.1" } },
  { name: "Татнефть-п", ticker: "TATNP", sector: "Нефть и газ", price: "75.50 ₽", changePercent: 1.75, logo: logoTatn, analytics: { pe: "4.5", pb: "0.85", evEbitda: "2.8", ndEbitda: "0.1" } },
  { name: "Транснефть-п", ticker: "TRNFP", sector: "Финансы", price: "1412.00 ₽", changePercent: 0.91, logo: logoTrnfp, analytics: { pe: "3.0", pb: "0.40", evEbitda: "2.5", ndEbitda: "0.8" } },
  { name: "ФосАгро", ticker: "PHOR", sector: "Химия", price: "7349.00 ₽", changePercent: 1.52, logo: logoPhor, analytics: { pe: "7.2", pb: "3.50", evEbitda: "5.5", ndEbitda: "0.6" } },
  { name: "ФСК ЕЭС", ticker: "FEES", sector: "Энергетика", price: "0.07 ₽", changePercent: 0.19, logo: logoFees, analytics: { pe: "2.8", pb: "0.15", evEbitda: "3.5", ndEbitda: "2.5" } },
  { name: "X5 Груп", ticker: "X5", sector: "Ритейл", price: "2430.50 ₽", changePercent: 0.08, logo: logoX5, analytics: { pe: "10.5", pb: "5.20", evEbitda: "5.8", ndEbitda: "1.0" } },
  { name: "Хэдхантер", ticker: "HEAD", sector: "IT", price: "1419.10 ₽", changePercent: 17.89, logo: logoHead, analytics: { pe: "18.5", pb: "12.00", evEbitda: "14.2", ndEbitda: "-0.8" } },
  { name: "ЭН+ ГРУП", ticker: "ENPG", sector: "Энергетика", price: "515.20 ₽", changePercent: 0.71, logo: logoEnpg, analytics: { pe: "—", pb: "0.30", evEbitda: "5.0", ndEbitda: "3.2" } },
  { name: "Южуралзолото", ticker: "UGLD", sector: "Металлургия", price: "98.98 ₽", changePercent: 0.03, logo: logoUgld, analytics: { pe: "9.2", pb: "2.80", evEbitda: "6.5", ndEbitda: "2.0" } },
  { name: "Юнипро", ticker: "UPRO", sector: "Энергетика", price: "1.54 ₽", changePercent: -0.49, logo: logoUpro, analytics: { pe: "6.0", pb: "0.55", evEbitda: "3.0", ndEbitda: "-0.3" } },
  { name: "Яндекс", ticker: "YDEX", sector: "IT", price: "4520.00 ₽", changePercent: 0.42, logo: logoYdex, analytics: { pe: "25.0", pb: "6.80", evEbitda: "15.5", ndEbitda: "-0.2" } },
];

export function getEmitterByTicker(ticker: string): EmitterData | undefined {
  return emitters.find(e => e.ticker.toLowerCase() === ticker.toLowerCase());
}
