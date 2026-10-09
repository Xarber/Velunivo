#!/usr/bin/env bash
# Never move tags. Pin the exact build before long jobs lose their branch ref.
set -euo pipefail
: "${RELEASE_TAG:?Required release tag}"
: "${GITHUB_SHA:?Required build commit}"
[[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'Invalid release tag'; exit 1; }
if git ls-remote --exit-code origin "refs/tags/$RELEASE_TAG" >/dev/null; then
  git fetch origin "refs/tags/$RELEASE_TAG:refs/tags/$RELEASE_TAG"
  actual=$(git rev-parse "$RELEASE_TAG^{commit}")
  test "$actual" = "$GITHUB_SHA" || { echo 'Existing release tag points to a different commit; choose a new version.'; exit 1; }
else
  git push origin "$GITHUB_SHA:refs/tags/$RELEASE_TAG"
fi
