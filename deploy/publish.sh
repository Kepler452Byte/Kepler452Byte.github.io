#!/usr/bin/env bash
set -euo pipefail
repo=/home/shaoyuanhong-01/projects/Kepler452Byte.github.io
instance=/home/shaoyuanhong-01/deployments/blog-prod
revision=${1:?Usage: publish.sh COMMIT}
sha=$(git -C "$repo" rev-parse --verify "$revision^{commit}")
mkdir -p "$instance/releases"
exec 8>"$instance/.build.lock"
flock -n 8
release="$instance/releases/$sha"
if ! docker image inspect "blog-prod:$sha" >/dev/null 2>&1; then
  [[ ! -e $release ]] || { echo "Release directory exists; inspect failed build before retry: $release" >&2; exit 1; }
  mkdir "$release"
  git -C "$repo" archive "$sha" | tar -x -C "$release"
  cd "$release"
  [[ $(pnpm --version) == 10.34.5 ]]
  pnpm install --frozen-lockfile
  NODE_OPTIONS=--max_old_space_size=8192 pnpm run docs:build
  test -s src/.vuepress/dist/index.html
  test -s src/.vuepress/dist/404.html
  docker build --label "org.opencontainers.image.revision=$sha" -f deploy/Dockerfile -t "blog-prod:$sha" .
fi
# Runtime scripts/config stay in the instance; applying changed deployment policy is a separate reviewed operation.
"$instance/activate.sh" "blog-prod:$sha"
