# nitrowater-plugin-docs

NitroWater 生态的**插件文档产物仓**：只负责「文档源 → 静态产物 → 镜像」，不包含部署编排，也不独立对外提供服务。

- 内容源：`plugins/<plugin-id>/docs/`（每个插件一套 VitePress 站点，各自一个 `base`）
- 静态产物：`dist/<plugin-id>/...` → URL `/<plugin-id>/...`
- 交付物：一个 nginx 静态镜像（`Dockerfile`），由下游（NitroWater）负责运行与路由
- 本仓**不生成**门户首页、清单、根跳转页；`/` 是 404，入口由下游决定

## 快速开始

```powershell
npm install

# 本地开发（每个插件一个 dev server，默认 5173 起）
npm run dev                 # 只起一个：npm run dev:velochatx
#   -> http://localhost:5173/velochatx/

# 构建静态产物到 dist/
npm run build

# 构建交付镜像
npm run docker:build        # nitrowater-plugin-docs:local
```

## 目录结构

```
nitrowater-plugin-docs/
├─ plugins/
│  └─ velochatx/
│     ├─ plugin.json              # 插件元数据（id/name/描述/仓库/排序）
│     └─ docs/                    # 整个 VitePress 站点
│        ├─ .vitepress/config.mts # 读取 plugin.json + 环境变量生成 base / outDir
│        ├─ .vitepress/theme/     # 主题与中英文 nav/sidebar
│        ├─ index.md              # 中文首页
│        ├─ guide/ reference/     # 中文内容
│        ├─ en/                   # 英文内容
│        └─ public/               # favicon/logo
├─ scripts/
│  ├─ build.mjs                   # 遍历 plugins/*，逐站点构建到 dist/<id>/
│  └─ dev.mjs                     # 多站点并行 dev server
├─ docker/nginx.conf              # 镜像内 nginx 配置
├─ Dockerfile                     # 两阶段构建：node 构建 -> nginx 托管
├─ dist/                          # 构建产物（gitignore）
└─ .ai/                           # AI 协作上下文（PROJECT.md + context/）
```

## 产物与 base 契约

**一个插件 = 一次 VitePress 构建**：VitePress 的 `base` 是构建期单值，所以多插件必须拆成多次构建，产物再由 nginx 合并成一棵树。本仓只负责把树和镜像做出来。

```
默认（根级）：
  plugins/velochatx  ->  dist/velochatx/  ->  /velochatx/
  plugins/foo        ->  dist/foo/        ->  /foo/

需要子路径时：
  DOCS_BASE_PREFIX=/docs npm run build
  plugins/velochatx  ->  dist/docs/velochatx/  ->  /docs/velochatx/
```

- `base` 必须**等于最终 URL 前缀**，由 `VITEPRESS_BASE` 或 `DOCS_BASE_PREFIX` + 插件 id 自动推导。
- 内容里的站内链接写**站点绝对路径**（`/guide/intro/get-start`），VitePress 自动补 `base`；**不要手写部署前缀**。
- `cleanUrls: false`：产物保留 `.html`，深层页面是真实文件，便于任何静态服务器托管。
- 镜像内 `/usr/share/nginx/html` = `dist/`，路径即 URL，`try_files $uri $uri/ $uri/index.html =404`。

## 新增一个插件

1. `plugins/<id>/plugin.json`（参照 `velochatx`，至少填 `id`、`name`、`description`、`repo`、`order`）。
2. `plugins/<id>/docs/` 放入 VitePress 站点（可直接复制已有插件的 `.vitepress` 再改 nav/sidebar/标题）。
3. 确保 `docs/.vitepress/config.mts` 使用本仓模板（从 `plugin.json` 读标题、按环境变量算 `base/outDir`）。
4. `npm run dev:<id>` 本地验证 → `npm run build` → 检查 `dist/<id>/`。
5. 不需要改构建脚本、nginx 或 Dockerfile。

## 镜像

```bash
docker build -t nitrowater-plugin-docs:local .
docker run --rm -p 8085:80 nitrowater-plugin-docs:local
# -> http://localhost:8085/velochatx/
```

- 运行期只有一个容器、一个端口；所有插件文档由路径区分，不按插件分端口/分实例。
- 基础镜像为 `nginx:alpine`，HTML/JSON 不缓存、带 hash 的资源长缓存，带 `/healthz`。
- 构建阶段需要 `git`（VitePress `lastUpdated` 会读 `git log`），因此 `.dockerignore` 不排除 `.git`。

## CI

`.github/workflows/docs.yml`：push `main`（或手动触发）→ `npm ci` → `npm run build` → `docker build` → 推送镜像。

- 镜像：`ghcr.io/<owner>/nitrowater-plugin-docs:latest` 和 `:<commit 前 7 位>`
- 凭据：`GITHUB_TOKEN`（已声明 `packages: write`），无需额外 secret
- 部署、反向代理、入口登记不在本仓；下游按需 `docker pull` 即可

```bash
docker pull ghcr.io/<owner>/nitrowater-plugin-docs:latest
```

## 与 `webs/velochatx-docs` 的关系

本仓的 `plugins/velochatx/docs/` 是 `velochatx-docs` 内容的迁移副本，之后 **以本仓为准**。
`velochatx-docs` 继续作为其独立 GitHub Pages 站点时，需要保持 `VITEPRESS_BASE` 兼容（该站点原有默认 base 为 `/VeloChatX-Docs/`）。

## 长周期约定

- AI 协作流、编码与验证规则见 [AGENTS.md](./AGENTS.md)。
- 项目理解与当前进度见 `.ai/PROJECT.md`、`.ai/context/current.md`。
