// Каталог источников новостей (используется в фильтрах и в подписке Base/Premium).
export interface NewsSource {
  id: string;
  name: string;
  category: "primary" | "extra" | "exclusive";
}

export const NEWS_SOURCES: NewsSource[] = [
  { id: "rbc",         name: "РБК",          category: "primary" },
  { id: "interfax",    name: "Интерфакс",    category: "primary" },
  { id: "tass",        name: "ТАСС",         category: "primary" },
  { id: "vedomosti",   name: "Ведомости",    category: "primary" },
  { id: "smartlab",    name: "Smart-Lab",    category: "primary" },
  { id: "finam",       name: "Финам",        category: "primary" },
  { id: "kommersant",  name: "Коммерсантъ",  category: "primary" },
  { id: "forbes",      name: "Forbes",       category: "primary" },
  { id: "edisclosure", name: "E-Disclosure", category: "primary" },
  { id: "moex",        name: "MOEX",         category: "primary" },
  { id: "banki",       name: "Banki.ru",     category: "extra" },
  { id: "frankmedia",  name: "Frank Media",  category: "extra" },
  { id: "investing",   name: "Investing.com",category: "extra" },
  { id: "bloomberg",   name: "Bloomberg",    category: "extra" },
  { id: "reuters",     name: "Reuters",      category: "extra" },
  { id: "ft",          name: "Financial Times", category: "extra" },
  { id: "wsj",         name: "WSJ",          category: "extra" },
  { id: "cbr",         name: "ЦБ РФ",        category: "extra" },
  { id: "minfin",      name: "Минфин",       category: "extra" },
  { id: "fns",         name: "ФНС",          category: "extra" },
  { id: "rosstat",     name: "Росстат",      category: "extra" },
  { id: "tg_invest",   name: "TG: Инвест-каналы", category: "extra" },
  { id: "tg_insider",  name: "TG: Инсайдеры",    category: "extra" },
  { id: "boards",      name: "Советы директоров", category: "extra" },
  { id: "scanner",     name: "Сканер аномалий",   category: "extra" },
];
