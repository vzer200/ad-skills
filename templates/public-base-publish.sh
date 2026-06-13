#!/usr/bin/env sh
set -eu

PUBLIC_BASE_REPO="${1:?usage: public-base-publish.sh <ad-build-public-base-repo> <branch> [public-base.tar]}"
BRANCH="${2:?usage: public-base-publish.sh <ad-build-public-base-repo> <branch> [public-base.tar]}"
BUNDLE="${3:-}"

if [ -n "$BUNDLE" ]; then
  ad-build public-base publish --repo "$PUBLIC_BASE_REPO" --branch "$BRANCH" --bundle "$BUNDLE"
else
  ad-build public-base publish --repo "$PUBLIC_BASE_REPO" --branch "$BRANCH"
fi

echo "public-base files written under: $PUBLIC_BASE_REPO/$BRANCH"
echo "Review, commit, and push that artifact repository explicitly."
