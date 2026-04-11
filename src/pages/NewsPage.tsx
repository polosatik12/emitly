import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Menu } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { FiltersModal } from "@/components/FiltersModal";
import { CompanyFilterModal } from "@/components/CompanyFilterModal";
import NewsDetailDrawer from "@/components/NewsDetailDrawer";
import { supabase } from "@/integrations/supabase/client";

export const mockNews = [
  {
    id: "1",
    ticker: "SBER",
    companyName: "Сбербанк",
    sector: "Финансы",
    price: 308.12,
    priceChange: 0.44,
    priceChangePercent: 0.14,
    category: "Событие",
    date: "9 февр.",
    fullDate: "9 февраля 2026 г. в 23:35",
    title: "Сбербанк открыл первый полностью роботизированный офис в Москве",
    bodyText: "Сбербанк представил новый формат обслуживания клиентов — полностью роботизированный офис в центре Москвы. Все операции, включая открытие счетов, выдачу карт и консультации, выполняются с помощью искусственного интеллекта и роботизированных систем. Банк планирует открыть ещё 15 таких офисов по всей России до конца 2026 года.",
    bullPercent: 50,
    bearPercent: 50,
    comments: 4,
    commentsList: [
      { name: "Алексей М.", date: "9 февр.", text: "Интересный ход, посмотрим как скажется на издержках", likes: 3 },
      { name: "Мария К.", date: "9 февр.", text: "Будущее уже здесь! Но живых консультантов будет не хватать", likes: 1 },
    ],
  },
  {
    id: "2",
    ticker: "SMLT",
    companyName: "Самолёт",
    sector: "Строительство",
    price: 1842.5,
    priceChange: 12.3,
    priceChangePercent: 0.67,
    category: "Событие",
    date: "9 февр.",
    fullDate: "9 февраля 2026 г. в 21:10",
    title: "Самолёт вышел на рынок Казахстана с проектом жилого комплекса в Астане",
    bodyText: "Группа «Самолёт» объявила о выходе на рынок Казахстана. Компания планирует построить жилой комплекс бизнес-класса в Астане общей площадью 120 тыс. кв. м. Это первый международный проект застройщика.",
    bullPercent: 67,
    bearPercent: 33,
    comments: 3,
    commentsList: [
      { name: "Дмитрий В.", date: "9 февр.", text: "Экспансия — это хорошо, но риски тоже растут", likes: 2 },
    ],
  },
  {
    id: "3",
    ticker: "POSI",
    companyName: "Positive Technologies",
    sector: "IT",
    price: 2156.0,
    priceChange: 34.5,
    priceChangePercent: 1.63,
    category: "Сделка",
    date: "9 февр.",
    fullDate: "9 февраля 2026 г. в 18:45",
    title: "Positive Technologies выиграла контракт на кибербезопасность",
    bodyText: "Positive Technologies получила крупный государственный контракт на обеспечение кибербезопасности критической инфраструктуры. Сумма контракта составляет более 2 млрд рублей. Реализация проекта рассчитана на 3 года.",
    bullPercent: 80,
    bearPercent: 20,
    comments: 5,
    commentsList: [
      { name: "Игорь С.", date: "9 февр.", text: "Отличная новость для компании!", likes: 5 },
      { name: "Анна Р.", date: "9 февр.", text: "Давно ждали такого контракта", likes: 2 },
    ],
  },
  {
    id: "4",
    ticker: "GAZP",
    companyName: "Газпром",
    sector: "Нефть и газ",
    price: 163.45,
    priceChange: -1.2,
    priceChangePercent: -0.73,
    category: "Событие",
    date: "8 февр.",
    fullDate: "8 февраля 2026 г. в 16:20",
    title: "Газпром увеличил поставки газа в Китай на 30%",
    bodyText: "Газпром отчитался об увеличении поставок трубопроводного газа в Китай по газопроводу «Сила Сибири» на 30% по сравнению с аналогичным периодом прошлого года. Компания также ведёт переговоры о расширении поставок.",
    bullPercent: 55,
    bearPercent: 45,
    comments: 2,
    commentsList: [
      { name: "Павел Н.", date: "8 февр.", text: "Китай — наше всё теперь", likes: 4 },
    ],
  },
  {
    id: "5",
    ticker: "LKOH",
    companyName: "Лукойл",
    sector: "Нефть и газ",
    price: 7245.0,
    priceChange: 85.0,
    priceChangePercent: 1.19,
    category: "Сделка",
    date: "8 февр.",
    fullDate: "8 февраля 2026 г. в 14:00",
    title: "Лукойл завершил сделку по приобретению нефтеперерабатывающего завода",
    bodyText: "Лукойл завершил приобретение нефтеперерабатывающего завода мощностью 6 млн тонн в год. Сделка позволит компании увеличить объём переработки нефти и расширить линейку нефтепродуктов.",
    bullPercent: 72,
    bearPercent: 28,
    comments: 6,
    commentsList: [
      { name: "Виктор Л.", date: "8 февр.", text: "Сильная сделка, дивиденды будут расти", likes: 7 },
      { name: "Елена Т.", date: "8 февр.", text: "Лукойл не перестаёт удивлять", likes: 3 },
    ],
  },
];
export default function NewsPage() {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [companyFilterOpen, setCompanyFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNews, setSelectedNews] = useState<typeof mockNews[0] | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
      const parts = name.split(/\s+/).filter(Boolean);
      const ini = parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : (parts[0]?.slice(0, 2) ?? "U").toUpperCase();

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;
      const avatar = profile?.avatar_url || (typeof meta.avatar_url === "string" ? meta.avatar_url : null);
      setAvatarUrl(avatar || null);
      const dn = profile?.display_name?.trim() || name;
      const p2 = dn.split(/\s+/).filter(Boolean);
      setInitials(
        p2.length >= 2
          ? `${p2[0][0]}${p2[1][0]}`.toUpperCase()
          : (p2[0]?.slice(0, 2) ?? "U").toUpperCase()
      );
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto pb-[60px] bg-background">
      {/* Header — Emitly */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <button onClick={() => navigate("/profile")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted border-2 border-border overflow-hidden active:scale-95 transition-transform">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] font-bold text-muted-foreground">{initials}</span>
          )}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[18px] tracking-[-0.02em]">
            <span className="font-extrabold text-primary">Emit</span><span className="font-extrabold text-foreground">ly</span>
          </span>
          <button className="p-1" onClick={() => setCompanyFilterOpen(true)}>
            <Menu className="w-[18px] h-[18px] text-foreground" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск компаний и новостей"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-[10px] rounded-[14px] border border-border bg-card text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-2.5">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-[7px] text-[13px] font-medium text-foreground border border-border rounded-full bg-card"
        >
          <SlidersHorizontal className="w-[14px] h-[14px]" strokeWidth={2} />
          Фильтры
        </button>
      </div>

      {/* Cards */}
      <div className="px-4 space-y-2.5 flex-1 pb-4">
        {mockNews
          .filter((n) =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.ticker.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((news, i) => (
            <NewsCard key={i} {...news} onClick={() => setSelectedNews(news)} />
          ))}
      </div>

      <FiltersModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      <CompanyFilterModal open={companyFilterOpen} onClose={() => setCompanyFilterOpen(false)} />
      <NewsDetailDrawer open={!!selectedNews} onClose={() => setSelectedNews(null)} news={selectedNews} />
    </div>
  );
}
