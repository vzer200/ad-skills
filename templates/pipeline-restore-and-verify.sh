#!/usr/bin/env sh
set -eu

: "${AD_BUILD_WORK_DIR:=/root/AD}"
: "${AD_BUILD_BUNDLE:=ad-build-compiled-state.tar}"
: "${AD_BUILD_MODULE:=}"

cd "$AD_BUILD_WORK_DIR"
ad-build bundle restore --bundle "$AD_BUILD_BUNDLE"
ad-build inventory status
ad-build diff --source-only
ad-build map --source-only

if [ -n "$AD_BUILD_MODULE" ]; then
  ad-build verify "$AD_BUILD_MODULE"
else
  echo "AD_BUILD_MODULE is empty; inspect .ad-build/module-map-result.json before running verify."
fi
