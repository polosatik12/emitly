import { useNavigate } from "react-router-dom";
import { Newspaper, BarChart3, Bell, FileText, Calendar, MessageCircle, LogIn, UserPlus } from "lucide-react";
import { getEmitterByTicker } from "@/data/emitters";
import { downloadFile } from "@/lib/download";

const newsItems = [
  {
    ticker: "SBER",
    headline: "Сбербанк открыл первый полностью роботизированный офис в Москве",
    description: "Новый формат отделения Сбера работает без сотрудников — все операции выполняют AI-ассистенты и роботы.",
  },
  {
    ticker: "SMLT",
    headline: "Самолёт вышел на рынок Казахстана с проектом жилого комплекса в Астане",
    description: "Девелопер «Самолёт» анонсировал первый международный проект — ЖК на 3000 квартир в столице Казахстана.",
  },
  {
    ticker: "POSI",
    headline: "Positive Technologies выиграла контракт на кибербезопасность для госсектора на 8 млрд рублей",
    description: "Positive Technologies заключила крупнейший в истории контракт на защиту критической инфраструктуры.",
  },
  {
    ticker: "MTSS",
    headline: "МТС запустил 5G-сеть в Москве и Петербурге",
    description: "МТС объявил о коммерческом запуске 5G в двух столицах с покрытием центральных районов.",
  },
];

const features = [
  {
    icon: Newspaper,
    title: "ИИ-анализ новостей",
    description: "Автоматическая категоризация, определение тональности и привязка к тикерам",
  },
  {
    icon: BarChart3,
    title: "Котировки MOEX",
    description: "Актуальные цены акций, лидеры роста и падения Московской биржи",
  },
  {
    icon: Bell,
    title: "Подписки и уведомления",
    description: "Следите за своими компаниями и получайте моментальные оповещения",
  },
  {
    icon: FileText,
    title: "50+ источников",
    description: "Telegram-каналы, IR-страницы компаний, новостные порталы — всё в одной ленте",
  },
  {
    icon: Calendar,
    title: "Календарь событий",
    description: "Дивиденды, отчёты, собрания акционеров — все корпоративные события",
  },
  {
    icon: MessageCircle,
    title: "Чат инвесторов",
    description: "Обсуждайте новости и делитесь мнениями с другими участниками",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-16">
          <div className="text-xl font-bold tracking-[-0.02em]">
            <span className="text-primary">Emit</span>
            <span className="text-foreground">ly</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/auth")} className="text-sm font-medium text-foreground hover:text-primary transition-colors px-4 py-2">
              Войти
            </button>
            <button onClick={() => navigate("/auth")} className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
              Начать бесплатно
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-24">
        <div className="grid grid-cols-2 gap-16 items-start">
          {/* Left side */}
          <div className="pt-8">
            <span className="inline-block text-sm font-medium text-primary bg-accent px-4 py-1.5 rounded-full mb-8">
              Бесплатно для всех инвесторов
            </span>
            <h1 className="text-[42px] leading-[1.15] font-bold text-foreground mb-6">
              Все новости российского рынка в одном месте
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-[440px]">
              Emitly собирает новости от 50+ источников, анализирует их с помощью ИИ и доставляет вам самое важное о ваших компаниях.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/auth")} className="flex items-center gap-2.5 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-primary/90 transition-colors">
                <UserPlus className="w-5 h-5" />
                Зарегистрироваться
              </button>
              <button onClick={() => navigate("/auth")} className="flex items-center gap-2.5 border border-border text-foreground px-7 py-3.5 rounded-xl text-base font-medium hover:bg-muted transition-colors">
                <LogIn className="w-5 h-5" />
                Войти
              </button>
            </div>
          </div>

          {/* Right side — news cards */}
          <div className="flex flex-col gap-3">
            {newsItems.map((item, i) => {
              const emitter = getEmitterByTicker(item.ticker);
              return (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center overflow-hidden">
                      {emitter ? (
                        <img src={emitter.logo} alt={emitter.name} className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-xs font-bold">{item.ticker[0]}</span>
                      )}
                    </div>
                    <span className="font-bold text-sm text-foreground">{item.ticker}</span>
                    <span className="text-sm text-muted-foreground">{emitter?.name || item.ticker}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug mb-1">
                    {item.headline}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/40 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Почему инвесторы выбирают Emitly
          </h2>
          <div className="grid grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-[600px] mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Начните следить за рынком прямо сейчас
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Регистрация занимает 30 секунд. Без привязки карты.
          </p>
          <button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground px-10 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors">
            Создать аккаунт бесплатно
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} Emitly</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span onClick={() => downloadFile("/docs/user-agreement.docx", "Пользовательское_соглашение.docx")} className="hover:text-foreground cursor-pointer transition-colors">Пользовательское соглашение</span>
            <span onClick={() => downloadFile("/docs/privacy-policy.docx", "Политика_обработки_данных.docx")} className="hover:text-foreground cursor-pointer transition-colors">Конфиденциальность</span>
            <span onClick={() => window.open("mailto:support@emitly.ru", "_blank")} className="hover:text-foreground cursor-pointer transition-colors">Поддержка</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
