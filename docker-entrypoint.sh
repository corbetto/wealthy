#!/bin/sh
set -e

PORT=8080 /app/api/server &

cd /app/web
exec node server.js
