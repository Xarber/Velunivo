#!/usr/bin/env bash
# CI-only curl defaults. React Native verifies completed shared-cache tarballs.
set -euo pipefail
: "${RUNNER_TEMP:?This helper runs only on the GitHub runner}"
: "${GITHUB_ENV:?GitHub environment output is required}"
curl_dir="$RUNNER_TEMP/velunivo-curl"
mkdir -p "$curl_dir"
cat > "$curl_dir/.curlrc" <<'CURL'
connect-timeout = 20
max-time = 180
retry = 2
retry-delay = 2
retry-all-errors
speed-time = 30
speed-limit = 8192
fail
silent
show-error
CURL
printf 'CURL_HOME=%s\n' "$curl_dir" >> "$GITHUB_ENV"
printf 'ENTERPRISE_REPOSITORY=https://repo.maven.apache.org/maven2\n' >> "$GITHUB_ENV"
