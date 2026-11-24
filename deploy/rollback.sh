#!/usr/bin/env bash
set -euo pipefail
cd /home/shaoyuanhong-01/deployments/blog-prod
image=${1:-$(cat previous-image)}
exec ./activate.sh "$image"
