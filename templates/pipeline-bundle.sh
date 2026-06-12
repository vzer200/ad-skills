#!/usr/bin/env sh
set -eu

: "${AD_BUILD_WORK_DIR:=/root/AD}"
: "${AD_BUILD_BUNDLE_PROFILE:=full}"
: "${AD_BUILD_BUNDLE_OUT:=ad-build-compiled-state.tar}"

cd "$AD_BUILD_WORK_DIR"
ad-build bundle pack --profile "$AD_BUILD_BUNDLE_PROFILE" --out "$AD_BUILD_BUNDLE_OUT"
ad-build bundle inspect --bundle "$AD_BUILD_BUNDLE_OUT"

cat <<MSG
Bundle created: $AD_BUILD_BUNDLE_OUT
Upload this file and its sidecar manifest/inventory JSON through your internal packaging platform.
MSG
