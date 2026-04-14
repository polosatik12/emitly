# News Parser Backend — Design Spec

## Architecture

Monolithic FastAPI + Celery + PostgreSQL + Redis + Ollama system for parsing, processing, and serving financial news.

### Components

- **FastAPI** — REST API on port 8000
- **Celery Worker** — background task processing (parsing, LLM)
- **Celery Beat** — scheduled parsing every 10 minutes
- **PostgreSQL** — persistent storage (news, emitters, sources)
- **Redis** — message broker + cache
- **Ollama** — local LLM (qwen2.5:7b) for text cleaning and deduplication

### Module Structure

```
app/
├── api/           # FastAPI routes (news, emitters, sources, stats)
├── core/          # config, database engine
├── emitters/      # ticker matching logic + ticker database
├── llm/           # Ollama client + prompts
├── models/        # SQLAlchemy models
├── parsers/       # Telegram + website parsers
└── tasks/         # Celery tasks (parse, process, schedule)
```

## Data Models

### Emitter
- `ticker` (PK) — e.g. "SBER"
- `name` — e.g. "Сбербанк"
- `aliases` — array: ["Сбер", "SBER", "Сбербанк"]

### NewsSource
- `id` (UUID), `name`, `source_type` (telegram/website), `url`, `parser_config` (JSONB), `enabled`, `last_parsed`

### NewsArticle
- `id` (UUID), `source_id` (FK), `raw_text`, `cleaned_text`, `title`, `published_at`, `hash` (SHA256, dedup), `llm_processed`

### NewsEmitter (association)
- `id` (UUID), `news_id` (FK), `emitter_ticker` (FK), `confidence`, `method` (auto/manual)

## Flow

1. **Celery Beat** triggers `run_full_parse_cycle` every 10 min
2. **parse_telegram_channels** fetches t.me/s/{channel} pages, extracts messages
3. **parse_websites** fetches each site, extracts news with per-site or generic parser
4. Each article is deduplicated via SHA256 hash before saving
5. New articles are queued for **process_news_with_llm**
6. LLM cleans text, detects tickers, rewrites for clarity
7. **EmitterMatcher** matches tickers via keyword matching
8. Results stored in DB, served via FastAPI

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/news | List news (pagination, filters: ticker, source_type, search) |
| GET | /api/v1/news/{id} | Single news article |
| GET | /api/v1/news/emitter/{ticker} | News by emitter |
| GET | /api/v1/emitters | All emitters |
| GET | /api/v1/sources | All sources |
| GET | /api/v1/stats | System statistics |
| POST | /api/v1/parse/telegram | Trigger Telegram parse |
| POST | /api/v1/parse/websites | Trigger website parse |
| POST | /api/v1/parse/full | Trigger full parse cycle |
| GET | /health | Health check |

## Sources

**Telegram**: 47 channels (finamalert, alfa_investments, vtbmyinvestments, etc.)
**Websites**: 20 sites (smart-lab.ru, rbc.ru, finam.ru, moex.com, etc.)

**Emitters**: 43 tickers (AFKS through YDEX) with Russian name aliases

## Deployment

Docker Compose with services: postgres, redis, ollama (GPU), app, celery_worker, celery_beat.
