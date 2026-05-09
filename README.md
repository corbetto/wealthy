# Wealthy — Personal Portfolio Tracker

A simple, fast, and polished personal wealth dashboard. Track bank accounts, stock holdings, and portfolio performance — all in one place.

**Base currency: NZD.** Supports USD and AUD holdings with automatic FX conversion.

---

## Screenshots

> Dashboard · Accounts · Stocks

The UI is inspired by Mercury Bank, Linear, and Apple Wallet — spacious, minimal, dark-mode ready.

---

## Architecture

```
wealthy/
├── apps/
│   ├── api/          — Go REST API (Gin, JSON persistence)
│   └── web/          — Next.js 15 frontend (App Router, Tailwind, Recharts)
└── docker-compose.yml
```

### Backend

- **Language:** Go 1.22
- **Router:** Gin
- **Persistence:** JSON file with atomic writes (temp-file swap)
- **Market data:** Yahoo Finance v7 API (unofficial, no API key needed)
- **Scheduler:** `robfig/cron` — daily portfolio snapshots at midnight UTC

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts (area chart + pie chart)
- **Data fetching:** TanStack Query v5 (with 5-minute auto-refresh on prices)

---

## Quick Start

### Option 1: Docker (recommended)

```bash
git clone <repo>
cd wealthy

# Start API + web
docker compose up --build

# Seed sample data (optional)
cp apps/api/data/seed.json <docker-volume-path>/wealthy.json
```

Open http://localhost:3000

### Option 2: Local development

**Prerequisites:** Go 1.22+, Node 20+

```bash
# Terminal 1 — API
cd apps/api
go mod download
DATA_PATH=./data/wealthy.json go run ./cmd/server

# Terminal 2 — Web
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000

The Next.js dev server proxies `/api/*` to the Go backend at `localhost:8080`.

---

## Seed Sample Data

```bash
cp apps/api/data/seed.json apps/api/data/wealthy.json
```

This loads sample accounts (ANZ, Kiwibank, Wise) and stock transactions (AAPL, MSFT, VTI, BHP.AX, AIR.NZ).

---

## API Reference

Base path: `http://localhost:8080/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List all accounts |
| POST | `/accounts` | Create account |
| PUT | `/accounts/:id` | Update account |
| DELETE | `/accounts/:id` | Delete account |
| GET | `/transactions` | List all transactions |
| POST | `/transactions` | Add transaction |
| PUT | `/transactions/:id` | Edit transaction |
| DELETE | `/transactions/:id` | Delete transaction |
| GET | `/holdings` | Current holdings with live prices |
| GET | `/portfolio/summary` | Portfolio totals |
| GET | `/portfolio/history?range=1W\|1M\|3M\|1Y\|ALL` | Historical snapshots |
| GET | `/market/prices?tickers=AAPL,MSFT` | Live market prices |
| GET | `/market/fx-rates` | USD and AUD to NZD rates |

All responses follow `{ "data": <payload> }` or `{ "error": "<message>" }`.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | API server port |
| `DATA_PATH` | `./data/wealthy.json` | JSON store path |
| `GIN_MODE` | `debug` | Set to `release` in production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend URL for web container |

---

## Supported Exchanges

| Exchange | Currency | Ticker format |
|----------|----------|---------------|
| US | USD | `AAPL`, `MSFT`, `VTI` |
| NZ | NZD | `AIR.NZ`, `FPH.NZ` |
| AU | AUD | `BHP.AX`, `CBA.AX` |

Yahoo Finance ticker suffixes (`.NZ`, `.AX`) are used directly.

---

## How Portfolio Calculations Work

1. **Holdings:** Transactions are replayed chronologically. Buys add to position; sells reduce using weighted-average cost basis and book realized gains.
2. **FX conversion:** USD/AUD holdings are converted to NZD using cached Yahoo Finance FX rates (refreshed every 60 min).
3. **Unrealized gain:** `(current price − avg cost) × quantity`, in NZD.
4. **Snapshots:** Taken on startup and daily at midnight. Powers the portfolio history chart.

---

## Roadmap to Postgres

The `FileStore` in `apps/api/internal/repository/store.go` implements a simple mutation pattern. Migrating to Postgres requires:

1. Replace `FileStore` with a `*sql.DB`-backed store.
2. Create tables: `accounts`, `transactions`, `portfolio_snapshots`, `market_prices`, `fx_rates`.
3. Wire up `pgx` or `database/sql` in `main.go`.
4. No changes needed in services or handlers — they only call repository interfaces.

Estimated migration effort: ~1–2 days.

---

## Future Features (not in MVP)

- Authentication (single-user password or passkey)
- Crypto holdings
- Dividend tracking
- Tax report export
- Push notifications for large portfolio moves
- CSV import for transaction history
- Superannuation / KiwiSaver tracking

---

## Development

```bash
# Lint & type-check frontend
cd apps/web && npm run type-check && npm run lint

# Build API
cd apps/api && go build ./...

# Run API tests (add your own)
cd apps/api && go test ./...
```
