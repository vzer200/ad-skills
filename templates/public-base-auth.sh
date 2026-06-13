#!/usr/bin/env sh
set -eu

printf "Git token: "
stty -echo 2>/dev/null || true
IFS= read -r TOKEN
stty echo 2>/dev/null || true
printf "\n"

if [ -z "$TOKEN" ]; then
  echo "empty token" >&2
  exit 2
fi

printf '%s' "$TOKEN" | ad-build public-base auth login --token-stdin --json
unset TOKEN
ad-build public-base auth status --json
