# ── API builder ──────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS api-builder
WORKDIR /app
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

# ── Web deps ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS web-deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci

# ── Web builder ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY --from=web-deps /app/node_modules ./node_modules
COPY apps/web/ .
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache ca-certificates tzdata wget

WORKDIR /app

COPY --from=api-builder /app/server ./api/server
COPY --from=web-builder /app/.next/standalone ./web/
COPY --from=web-builder /app/public ./web/public
COPY --from=web-builder /app/.next/static ./web/.next/static

RUN mkdir -p /data

ENV DATA_PATH=/data/wealthy.json
ENV GIN_MODE=release
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000
VOLUME ["/data"]

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["/docker-entrypoint.sh"]
