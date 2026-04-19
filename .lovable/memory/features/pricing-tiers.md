---
name: Pricing Tiers Backend
description: Концепция и бэкенд тарифов Free/Base/Premium/Pro с триалом 7 дней, лимитами эмитентов/источников и блюром недоступного контента
type: feature
---

## Тарифы (источник истины)

| Plan    | Эмитенты | Источники | Уведомления      | Поддержка    |
|---------|----------|-----------|-------------------|--------------|
| Free    | все      | все       | TG/web/email      | общий чат    |
| Base    | до 5     | до 10     | TG/web/email      | общий чат    |
| Premium | до 20    | до 20     | TG/web/email      | общий чат    |
| Pro     | до 50    | все       | TG/web/email      | общий чат    |

- **Free** = 7-дневный полный доступ (как Pro). После окончания — блокирующий paywall (`TrialPaywallModal`), без выбора закрытия.
- На Base/Premium новость от источника, на который пользователь не подписан, **блюрится** через `LockedNewsOverlay` (CTA «Сменить тариф»).
- Pro и активный триал имеют `hasAllSources = true` — блюр не применяется.

## БД

- `profiles.trial_started_at` — стартует через RPC `start_trial_if_needed()` при первом заходе.
- `profiles.notify_telegram / notify_web / notify_email` — каналы уведомлений (UI в `/settings`).
- `user_source_subscriptions(user_id, source UNIQUE)` — выбранные источники для Base/Premium, RLS only owner.
- RPC `get_user_plan()` возвращает: `plan_id`, `is_trial`, `trial_active`, `trial_days_left`, `is_blocked`, `max_emitters`, `max_sources`, `expires_at`. Считает активную подписку из `subscriptions` (status='active' AND expires_at > now()).

## Frontend архитектура

- **`usePlan` (`src/hooks/usePlan.tsx`)** — единый источник истины (Context + Provider), содержит `isSourceAllowed(src)`. `PlanProvider` оборачивает `AppLayout` (мобайл и десктоп).
- **`useEmitterSubscriptions`** и **`useSourceSubscriptions`** жёстко проверяют лимиты перед `insert` и тостят отказ.
- **`TrialPaywallModal`** монтируется в `AppLayout` глобально, открывается при `isBlocked=true`.
- **Каталог тарифов** — `/service-catalog` (4 плана, без устаревшего «trial»; убраны эксклюзивные источники).
- **`/sources`** — отдельная страница управления источниками (доступ из настроек).
- **`/settings`** — добавлена секция «Уведомления» с тремя свитчами и сохранением в `profiles`.

## Источники

Каталог в `src/data/sources.ts` (NEWS_SOURCES). ID источника = ключ в `user_source_subscriptions.source`. Поле `news.source` пока опционально — добавится при реальной интеграции парсера.

## Что НЕ входит в текущий скоп

- Реальная отправка уведомлений в TG/email (только UI-настройки и каналы в БД).
- Привязка `telegram_chat_id` (поле есть, флоу позже).
- Отображение `source` в карточке новости (поле в `news` пока не заполняется).
