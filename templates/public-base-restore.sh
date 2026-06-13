#!/usr/bin/env sh
set -eu

BRANCH="${1:?usage: public-base-restore.sh <release-dir>}"

ad-build public-base use --branch "$BRANCH" --json

echo "public-base restored and validated for: $BRANCH"
