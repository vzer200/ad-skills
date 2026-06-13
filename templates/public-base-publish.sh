#!/usr/bin/env sh
set -eu

BRANCH="${1:?usage: public-base-publish.sh <release-dir> [public-base.tar]}"
PUBLIC_BASE_TAR="${2:-/root/public-base.tar}"

ad-build public-base check --bundle "$PUBLIC_BASE_TAR" --integrity-only --json
ad-build public-base publish --branch "$BRANCH" --bundle "$PUBLIC_BASE_TAR" --push --json

echo "public-base published to fixed artifact repository for: $BRANCH"
