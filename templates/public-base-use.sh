#!/usr/bin/env sh
set -eu

BRANCH="${1:?usage: public-base-use.sh <release-dir>}"

ad-build public-base use --branch "$BRANCH" --json
ad-build public-base status --json

echo "public-base ready for: $BRANCH"
