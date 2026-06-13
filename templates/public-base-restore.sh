#!/usr/bin/env sh
set -eu

BUNDLE="${1:?usage: public-base-restore.sh <public-base.tar>}"

ad-build public-base restore --bundle "$BUNDLE"
ad-build public-base status
ad-build public-base check --bundle "$BUNDLE"

echo "public-base restored and validated from: $BUNDLE"
