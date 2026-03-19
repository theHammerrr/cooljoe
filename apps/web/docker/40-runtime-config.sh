#!/bin/sh
set -eu

config_file="/usr/share/nginx/html/runtime-config.js"
api_url="${APP_API_URL:-${VITE_API_URL:-${API_URL:-}}}"

if [ ! -f "$config_file" ]; then
  echo "runtime-config.js not found, skipping runtime env injection"
  exit 0
fi

escaped_api_url=$(printf '%s' "$api_url" | sed 's/[\\/&|]/\\&/g')
sed -i "s|__APP_API_URL__|$escaped_api_url|g" "$config_file"

echo "Injected runtime API URL into $config_file"
