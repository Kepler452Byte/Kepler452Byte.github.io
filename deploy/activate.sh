#!/usr/bin/env bash
set -euo pipefail
cd /home/shaoyuanhong-01/deployments/blog-prod
exec 9>.release.lock
flock -n 9
image=${1:?Usage: activate.sh blog-prod:SHA}
[[ $image =~ ^blog-prod:[a-f0-9]{40}$ ]] || { echo 'Invalid release image' >&2; exit 1; }
docker image inspect "$image" >/dev/null
docker run --rm --entrypoint nginx "$image" -t
old=$(sed -n 's/^BLOG_IMAGE=//p' .env 2>/dev/null || true)
printf 'BLOG_IMAGE=%s\n' "$image" > .env.next
mv .env.next .env
restore() {
  if [[ -n $old ]]; then
    printf 'BLOG_IMAGE=%s\n' "$old" > .env.next
    mv .env.next .env
    docker compose up -d --no-deps nginx
    echo "Restored $old" >&2
  fi
}
trap 'restore' ERR
docker compose up -d --no-deps nginx
for attempt in {1..20}; do
  if ./health.sh >/dev/null 2>&1; then
    if [[ -n $old && $old != "$image" ]]; then printf '%s\n' "$old" > previous-image; fi
    printf '%s\n' "$image" > current-image
    trap - ERR
    echo "Activated $image"
    exit 0
  fi
  sleep 2
done
false
