# 静态文档镜像：构建阶段跑 VitePress，运行阶段只留 nginx + 产物
FROM node:22-alpine AS build

WORKDIR /app

# VitePress 的 lastUpdated 依赖 git log 取文件时间，构建层需要 git。
RUN apk add --no-cache git

# 依赖层单独缓存
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

COPY . .

# 部署前缀：NitroWater 通过 BFF 以 /plugin/<id>/ 暴露本站，所以默认 /plugin。
# VitePress 的 base 是**构建期写死**的，nginx rewrite 补救不了 —— 换前缀必须重建镜像。
# 本地想直接看根路径（/<id>/）时传 --build-arg DOCS_BASE_PREFIX=。
ARG DOCS_BASE_PREFIX=/plugin
ENV DOCS_BASE_PREFIX=${DOCS_BASE_PREFIX}

RUN npm run build

FROM nginx:1.27-alpine

# 与 nitrowater/deploy/docker/docs-nginx.conf 的语义保持一致（.html 真文件 + 目录 index 兜底）
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# 清掉 nginx 自带的 index.html / 50x.html：两处 conf 都把 `/` 定成 404，
# 留着它们只会让 `/index.html` 露出默认欢迎页。
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
