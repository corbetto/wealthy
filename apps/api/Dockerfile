FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/server .

RUN mkdir -p /data
ENV DATA_PATH=/data/wealthy.json
ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080
VOLUME ["/data"]

CMD ["./server"]
