# Blog production

Source: main; VuePress 2 / Theme Hope; pnpm 10.34.5; `pnpm install --frozen-lockfile && pnpm run docs:build`; output `src/.vuepress/dist`.

Production: `/home/shaoyuanhong-01/deployments/blog-prod`, Compose project `blog-prod`, private bind `192.168.8.142:18091`. Immutable static Nginx images, no application/database server. Gateway terminates HTTPS; household router permits only bjnew source 10.11.0.1 to this host and TCP port. Source remains on GitHub. CI validates builds and does not deploy Pages. Releases are manual, with no new deployment credentials.

Runtime compose/scripts are installed once from this directory. Inspect any policy changes before updating them. Use these commands on the home desktop:

```bash
~/deployments/blog-prod/publish.sh <full-commit-sha>
~/deployments/blog-prod/health.sh
~/deployments/blog-prod/health.sh https://kepler452byte.tech
~/deployments/blog-prod/rollback.sh
# Or select an explicitly retained release:
~/deployments/blog-prod/rollback.sh blog-prod:<full-commit-sha>
```

Publish archives the selected committed source into releases/SHA, builds before switching, and restores the old image automatically if health fails. It never cleans or resets the developer checkout. Successful releases retain images and record previous-image. The first migration has no previous home release; GitHub Pages remains unchanged until DNS/certificate cutover is complete. Failed build directories are kept for diagnosis; inspect and move them aside before retrying the same SHA. No automatic cleanup, database backup, image export, or host restart.

Gateway site: `/etc/nginx/sites-available/kepler452byte.tech`, independent enabled symlink; logs `/var/log/nginx/blog.access.log` and `blog.error.log`, using the existing nginx logrotate policy. Only enable TLS after authoritative/public DNS points directly at 39.107.34.202. Existing www is absent; do not add it. Remove the GitHub Pages custom domain and disable Pages after cutover.

ICP footer: 京ICP备2024068300号-5, https://beian.miit.gov.cn/. Existing public-security registration is preserved pending the owner's factual verification. This topology does not guarantee ICP review acceptance.
