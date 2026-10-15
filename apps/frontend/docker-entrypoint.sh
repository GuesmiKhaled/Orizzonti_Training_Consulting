#!/bin/sh
set -eu

api_base_url="${API_BASE_URL:-http://localhost:5007}"
case "$api_base_url" in
  http://*|https://*) ;;
  *) echo "API_BASE_URL must start with http:// or https://" >&2; exit 1 ;;
esac

printf 'window.__ORIZZONTI_CONFIG__ = { apiBaseUrl: "%s" };\n' "$api_base_url" \
  > /usr/share/nginx/html/runtime-config.js

exec nginx -g 'daemon off;'
