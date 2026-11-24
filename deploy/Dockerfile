FROM nginx:1.28-alpine@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY src/.vuepress/dist/ /usr/share/nginx/html/
