#!/usr/bin/env sh
set -eu

OUT="${1:-/root/public-base.tar}"
BUILD_CMD="${AD_BUILD_FULL_BUILD_CMD:-./compile.sh}"

if [ "${AD_BUILD_SKIP_FULL_BUILD:-0}" != "1" ]; then
  ad-build full-build -- sh -lc "$BUILD_CMD"
fi

ad-build public-base pack --out "$OUT" --json
ad-build public-base check --bundle "$OUT" --integrity-only --json

echo "public-base bundle is ready: $OUT"
