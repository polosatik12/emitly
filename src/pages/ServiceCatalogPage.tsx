import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Bell, Globe, Headphones, ChevronDown, ChevronUp, Check, Minus, FileText, Copy, X, Download } from "lucide-react";
import { downloadFile } from "@/lib/download";

const plans = [
  {
    id: "trial",
    name: "Пробный",
    price: "0",
    currency: "₽",
    period: "/ 48 часов",
    description: "Бесплатный пробный период для знакомства с сервисом",
    color: "hsl(var(--muted-foreground))",
    popular: false,
    highlighted: false,
    chips: [
      { icon: "users", text: "1 эмитент(ов)" },
      { icon: "bell", text: "Базовые (до 10 в день)" },
      { icon: "globe", text: "Основные (5 источников)" },
      { icon: "support", text: "FAQ и документация" },
    ],
    includes: [
      "Доступ к основной ленте новостей",
      "Фильтрация по 1 эмитенту",
      "Просмотр котировок в реальном времени",
      "Базовые push-уведомления",
      "Доступ к мобильному приложению",
    ],
    excludes: ["Персональная поддержка"],
    specs: {
      notifications: "Базовые (до 10 в день)",
      analytics: "Нет",
    },
    buttonText: "Попробовать бесплатно",
    buttonStyle: "outline" as const,
  },
  {
    id: "base",
    name: "Base",
    price: "199",
    currency: "₽",
    period: "/ месяц",
    description: "Оптимальный выбор для начинающих инвесторов",
    color: "hsl(210, 100%, 50%)",
    popular: false,
    highlighted: false,
    chips: [
      { icon: "users", text: "5 эмитент(ов)" },
      { icon: "bell", text: "Мгновенные (без ограничений)" },
      { icon: "globe", text: "Расширенные (15 источников)" },
      { icon: "support", text: "Email (до 24ч ответ)" },
    ],
    includes: [
      "Все возможности пробного периода",
      "Подписка на 5 эмитентов",
      "Мгновенные push-уведомления",
      "15 источников информации",
      "Фильтрация по категориям",
      "Поддержка по email",
    ],
    excludes: ["Аналитика и статистика"],
    specs: {
      notifications: "Мгновенные (без ограничений)",
      analytics: "Нет",
    },
    buttonText: "Выбрать план",
    buttonStyle: "outline" as const,
  },
  {
    id: "premium",
    name: "Premium",
    price: "299",
    currency: "₽",
    period: "/ месяц",
    description: "Профессиональный инструмент для активных инвесторов",
    color: "hsl(160, 84%, 39%)",
    popular: true,
    highlighted: true,
    chips: [
      { icon: "users", text: "20 эмитент(ов)" },
      { icon: "bell", text: "Мгновенные" },
      { icon: "globe", text: "Все доступные (25+ источников)" },
      { icon: "support", text: "Чат (до 4ч ответ)" },
    ],
    includes: [
      "Все возможности Base",
      "Подписка на 20 эмитентов",
      "Все источники информации",
      "Аналитика и статистика",
      "Поддержка в чате",
      "Торговые аномалии",
      "Крупные сделки инсайдеров",
    ],
    excludes: [],
    specs: {
      notifications: "Мгновенные",
      analytics: "Да",
    },
    buttonText: "Выбрать план",
    buttonStyle: "primary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    price: "499",
    currency: "₽",
    period: "/ месяц",
    description: "Максимальные возможности для профессионалов рынка",
    color: "hsl(160, 84%, 39%)",
    popular: false,
    highlighted: false,
    chips: [
      { icon: "users", text: "50 эмитент(ов)" },
      { icon: "bell", text: "Приоритетные" },
      { icon: "globe", text: "Все + эксклюзивные" },
      { icon: "support", text: "Приоритет (до 1ч ответ)" },
    ],
    includes: [
      "Все возможности Premium",
      "Подписка на 50 эмитентов",
      "Эксклюзивные источники",
      "Расширенная аналитика",
      "Приоритетная поддержка 24/7",
    ],
    excludes: [],
    specs: {
      notifications: "Приоритетные",
      analytics: "Да",
    },
    buttonText: "Выбрать план",
    buttonStyle: "outline" as const,
  },
];

const requisites = [
  { label: "Название компании", value: "КАРПОВ АЛЕКСАНДР ВИКТОРОВИЧ (ИП)" },
  { label: "Адрес", value: "улица Абрамцевская, д. 5, кв./оф. кв. 94, г. Москва" },
  { label: "ИНН", value: "771593979816" },
  { label: "Номер счёта", value: "40802810001060004432" },
  { label: "Валюта", value: "RUR" },
  { label: "Банк", value: 'АО "АЛЬФА-БАНК"' },
  { label: "БИК", value: "044525593" },
  { label: "Корреспондентский счёт", value: "30101810200000000593" },
];

function ChipIcon({ icon }: { icon: string }) {
  const cls = "h-4 w-4 text-muted-foreground shrink-0";
  switch (icon) {
    case "users": return <Users className={cls} />;
    case "bell": return <Bell className={cls} />;
    case "globe": return <Globe className={cls} />;
    case "support": return <Headphones className={cls} />;
    default: return null;
  }
}

export default function ServiceCatalogPage() {
  const navigate = useNavigate();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [showRequisites, setShowRequisites] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto pb-[80px] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2 sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">Каталог услуг</h1>
      </div>

      <div className="px-4 pt-2 space-y-5">
        {/* About */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5">
          <h2 className="text-[16px] font-bold text-foreground">О сервисе Emitly</h2>
          <p className="text-[14px] text-muted-foreground mt-3 leading-relaxed">
            <strong className="text-foreground">Emitly</strong> — информационный сервис для инвесторов, предоставляющий агрегированную ленту новостей по российским эмитентам в режиме реального времени.
          </p>
          <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
            Услуга включает мониторинг новостей, уведомления о важных событиях, аналитические инструменты и интеграцию с торговыми системами.
          </p>
        </div>

        {/* Plans */}
        <h2 className="text-[18px] font-bold text-foreground">Тарифные планы</h2>

        {plans.map((plan) => {
          const isExpanded = expandedPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-card p-5 relative ${
                plan.highlighted
                  ? "border-[hsl(160,84%,39%)] border-2"
                  : "border-[hsl(var(--border))]"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-3 right-4 bg-[hsl(160,84%,39%)] text-white text-[11px] font-semibold px-3 py-1 rounded-md">
                  Популярный
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-[18px] font-bold text-foreground">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[24px] font-bold text-foreground">{plan.price}</span>
                  <span className="text-[18px] text-foreground">₽</span>
                  <div className="text-[12px] text-muted-foreground">{plan.period}</div>
                </div>
              </div>

              <p className="text-[13px] text-muted-foreground mt-1">{plan.description}</p>

              {/* Feature chips */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {plan.chips.map((chip, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[hsl(var(--muted))] rounded-xl px-3 py-2.5">
                    <ChipIcon icon={chip.icon} />
                    <span className="text-[12px] text-foreground leading-tight">{chip.text}</span>
                  </div>
                ))}
              </div>

              {/* Expandable description */}
              <button
                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                className="flex items-center justify-between w-full mt-4 pt-3 border-t border-[hsl(var(--border))]"
              >
                <span className="text-[14px] font-medium text-foreground">Подробное описание</span>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-4">
                  {/* Includes */}
                  <div>
                    <p className="text-[13px] font-semibold text-foreground mb-2">Что входит:</p>
                    <div className="space-y-1.5">
                      {plan.includes.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[hsl(160,84%,39%)] shrink-0 mt-0.5" />
                          <span className="text-[13px] text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Excludes */}
                  {plan.excludes.length > 0 && (
                    <div>
                      <p className="text-[13px] font-semibold text-muted-foreground mb-2">Не входит:</p>
                      <div className="space-y-1.5">
                        {plan.excludes.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Minus className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-[13px] text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="border-t border-[hsl(var(--border))] pt-3">
                    <p className="text-[13px] font-semibold text-foreground mb-2">Технические характеристики:</p>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Уведомления:</span>
                      <span className="text-foreground">{plan.specs.notifications}</span>
                    </div>
                    <div className="flex justify-between text-[13px] mt-1">
                      <span className="text-muted-foreground">Аналитика:</span>
                      <span className="text-foreground">{plan.specs.analytics}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <button
                className={`mt-4 w-full rounded-xl py-3 text-[14px] font-semibold transition-transform active:scale-[0.97] ${
                  plan.buttonStyle === "primary"
                    ? "bg-[hsl(160,84%,39%)] text-white"
                    : "border border-[hsl(var(--border))] bg-background text-foreground"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          );
        })}

        {/* Legal Info */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-[16px] font-bold text-foreground">Правовая информация</h2>
          </div>

          <div className="space-y-1 text-[13px] text-foreground">
            <p className="font-semibold">Исполнитель услуг</p>
            <p className="text-muted-foreground">ИП Карпов Александр Викторович</p>
            <p className="text-muted-foreground">ИНН: 771593979816</p>
            <p className="text-muted-foreground">Адрес: г. Москва, ул. Абрамцевская, д. 5, кв. 94</p>
          </div>

          <div className="mt-4 space-y-1 text-[13px]">
            <p className="font-semibold text-foreground">Условия оплаты</p>
            <p className="text-muted-foreground">• Оплата производится единовременно за выбранный период</p>
            <p className="text-muted-foreground">• Принимаются банковские карты Visa, Mastercard, МИР</p>
            <p className="text-muted-foreground">• Подписка активируется автоматически после оплаты</p>
            <p className="text-muted-foreground">• Автопродление: да, с возможностью отключения</p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => downloadFile("/docs/user-agreement.docx", "Пользовательское_соглашение.docx")}
              className="flex items-center gap-2 justify-center rounded-xl border border-[hsl(var(--border))] py-3 text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform"
            >
              <Download className="h-4 w-4" />
              Пользовательское соглашение
            </button>
            <button
              onClick={() => downloadFile("/docs/privacy-policy.docx", "Политика_обработки_данных.docx")}
              className="flex items-center gap-2 justify-center rounded-xl border border-[hsl(var(--border))] py-3 text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform"
            >
              <Download className="h-4 w-4" />
              Политика обработки данных
            </button>
          </div>

          <button
            onClick={() => setShowRequisites(true)}
            className="mt-2 flex items-center gap-2 w-full justify-center rounded-xl border border-[hsl(var(--border))] py-3 text-[13px] font-medium text-foreground active:scale-[0.97] transition-transform"
          >
            <FileText className="h-4 w-4" />
            Показать полные реквизиты
          </button>
        </div>

        {/* Contacts */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-[16px] font-bold text-foreground">Контакты</h2>
          </div>

          <div className="space-y-2 text-[13px]">
            <p>
              <span className="text-muted-foreground">Email: </span>
              <a href="mailto:support@emitly.ru" className="text-[hsl(160,84%,39%)]">support@emitly.ru</a>
            </p>
            <p>
              <span className="text-muted-foreground">Telegram: </span>
              <a href="https://t.me/emitly_support" className="text-[hsl(160,84%,39%)]">@emitly_support</a>
            </p>
            <p className="text-muted-foreground">Время работы поддержки: Пн-Пт 9:00-21:00 (МСК)</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-muted-foreground pb-4">© 2026 Emitly</p>
      </div>

      {/* Requisites Modal */}
      {showRequisites && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowRequisites(false)}>
          <div
            className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 pb-3 sticky top-0 bg-card">
              <h3 className="text-[16px] font-bold text-foreground">Реквизиты</h3>
              <button onClick={() => setShowRequisites(false)} className="p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 pb-6 divide-y divide-[hsl(var(--border))]">
              {requisites.map((item, i) => (
                <div key={i} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-muted-foreground">{item.label}</p>
                    <p className="text-[14px] text-foreground mt-0.5 break-words">{item.value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.value, i)}
                    className="p-1.5 shrink-0 mt-2"
                  >
                    {copiedIndex === i ? (
                      <Check className="h-4 w-4 text-[hsl(160,84%,39%)]" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
