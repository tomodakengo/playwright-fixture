#!/usr/bin/env sh
set -e

# When running under docker compose, the SUT lives at http://app:3000 and is
# started by the `app` service. Disable Playwright's webServer so it doesn't
# try to spawn a second copy.
export BASE_URL="${BASE_URL:-http://app.test:3000}"
export PLAYWRIGHT_DISABLE_WEBSERVER="${PLAYWRIGHT_DISABLE_WEBSERVER:-1}"

exec "$@"
