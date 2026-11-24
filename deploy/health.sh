#!/usr/bin/env bash
set -euo pipefail
base=${1:-http://192.168.8.142:18091}
for path in / /en/ /zh/backend/python-engineering/how-to-write-unit-tests.html /assets/images/avatar-field-notes.png /sitemap.xml; do
  curl --noproxy '*' -fsS --max-time 15 -o /dev/null "$base$path"
done
code=$(curl --noproxy '*' -sS --max-time 15 -o /dev/null -w '%{http_code}' "$base/__blog_missing_page__")
[[ $code == 404 ]]
echo "Blog HTTP health passed: $base"
