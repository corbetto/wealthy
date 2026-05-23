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
git clone https://github.com/corbetto/wealthy.git
cd wealthy

docker compose up --build
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

## Development & Release Workflow

### Making changes

1. Make and test your changes locally using Option 2 above
2. Verify the production build works:
   ```bash
   docker compose up --build
   ```
3. Commit your changes:
   ```bash
   git add <files>
   git commit -m "feat/fix: description of change"
   ```

### Publishing a release

Wealthy uses [semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH`

- `PATCH` (1.0.**1**) — bug fixes
- `MINOR` (1.**1**.0) — new features
- `MAJOR` (**2**.0.0) — breaking changes

After committing, tag the release, push to GitHub, and publish to Docker Hub:

```bash
# Push code and tag to GitHub
git push
git tag v1.0.1
git push origin v1.0.1

# Build and push versioned + latest image to Docker Hub
docker build -t corbettjms/wealthy:v1.0.1 -t corbettjms/wealthy:latest .
docker push corbettjms/wealthy:v1.0.1
docker push corbettjms/wealthy:latest

# Create GitHub Release with changelog
gh release create v1.0.1 --title "v1.0.1" --notes "What changed in this release"
```

Versioned Docker tags (`v1.0.1`) act as permanent snapshots — users can pin to a specific version if a newer update causes issues.

### Deploying the update on Unraid

Once the new image is on Docker Hub, open the Unraid Docker tab, find the Wealthy container, and click **Update**. Unraid will pull the latest image and restart the container. Your data in `/mnt/user/appdata/wealthy` is preserved.

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
