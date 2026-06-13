#!/usr/bin/env sh
set -eu

OUT="${1:-public-base.tar}"
BUILD_CMD="${AD_BUILD_FULL_BUILD_CMD:-./compile.sh}"

if [ "${AD_BUILD_SKIP_FULL_BUILD:-0}" != "1" ]; then
  ad-build full-build -- sh -lc "$BUILD_CMD"
fi

ad-build public-base key
ad-build public-base pack --out "$OUT"
ad-build public-base check --bundle "$OUT"

echo "public-base bundle is ready: $OUT"
