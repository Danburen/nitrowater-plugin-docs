# nitrowater-plugin-docs

NitroWater 生态的**插件文档聚合仓**：一个仓库存放多个插件的 VitePress 文档，构建产物汇总为一棵静态目录树，最终打成**单个 nginx 镜像**，由 NitroWater 的文档服务静态挂载。

- 内容源：`plugins/<plugin-id>/docs/`（每个插件一套独立 VitePress 站点 + 自己的 `base`）
- 产物：`dist/<plugin-id>/...` → URL `/<plugin-id>/...`（URL 与磁盘一一对应）
- 部署：Docker 镜像 → `docs` 容器 → 经 NitroWater 门户入口访问
- **不独立部署、不做门户首页**：本仓只负责"每个插件的文档站在自己的路径下可用"，入口统一由 NitroWater 提供。

## 快速开始

```powershell
npm install

# 本地开发（每个插件一个 dev server，默认 5173 起）
npm run dev                 # 只起一个：npm run dev:velochatx
#   -> http://localhost:5173/velochatx/

# 构建全部站点到 dist/
npm run build

# 本地预览构建产物
npm run preview                                     # VitePress preview（单插件）
docker compose up --build                           # 完整镜像 -> http://localhost:8085/velochatx/
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
│  ├─ build.mjs                   # 遍历 plugins/*，逐站点构建
│  └─ dev.mjs                     # 多站点并行 dev server
├─ docker/nginx.conf              # 容器内 nginx 配置
├─ Dockerfile / docker-compose.yml
├─ dist/                          # 构建产物（gitignore）
└─ .ai/                           # AI 协作上下文（PROJECT.md + context/）
```

## 路由与 base 契约

**结论：可行，但不是"一个 VitePress 站点配多个 base"，而是"一个插件一次构建、各自一个 base"。**
VitePress 的 `base` 是**构建期单值**（所有资源/链接都由它前缀化），一个站点只能有一个 `base`，因此多插件必须拆成多次构建，再由 nginx 合并成同一棵静态树。

```
默认（根级）：
  plugins/velochatx  ->  dist/velochatx/  ->  http://<host>/velochatx/
  plugins/foo        ->  dist/foo/        ->  http://<host>/foo/

需要子路径时：
  DOCS_BASE_PREFIX=/docs npm run build
  plugins/velochatx  ->  dist/docs/velochatx/  ->  http://<host>/docs/velochatx/
```

- 构建时 `base` 必须**等于最终 URL 前缀**，由 `VITEPRESS_BASE` 或 `DOCS_BASE_PREFIX` + 插件 id 自动推导（默认即 `/<id>/`）。
- 内容里的站内链接写成**站点绝对路径**（`/guide/intro/get-start`），VitePress 会自动补上当前站点的 `base`；**不要在 Markdown 里手写 `/<id>/` 前缀**。
- `cleanUrls: false`（默认）：产物保留 `.html`，深层页面是真实文件，便于 nginx 静态托管与 404 边界。
- 本仓**不生成**门户首页、文档清单或根路径跳转页；根路径 `/` 直接 404，入口完全由 NitroWater 门户决定。

## 新增一个插件

1. `plugins/<id>/plugin.json`（参照 `velochatx`，至少填 `id`、`name`、`description`、`repo`、`order`）。
2. `plugins/<id>/docs/` 放入 VitePress 站点（可直接复制一个已有插件的 `.vitepress` 再改 nav/sidebar/标题）。
3. 确保 `docs/.vitepress/config.mts` 使用本仓模板（从 `plugin.json` 读标题、按环境变量算 `base/outDir`）。
4. `npm run dev:<id>` 本地验证 → `npm run build` → 检查 `dist/<id>/`。
5. 不需要改构建脚本、nginx、Dockerfile 或门户代码（门户侧只需增加一个指向 `/<id>/` 的入口）。

## Docker / 接入 NitroWater

镜像内 `/usr/share/nginx/html` 就是 `dist/`：

```bash
docker build -t nitrowater-plugin-docs:local .
docker run --rm -p 8085:80 nitrowater-plugin-docs:local
# -> http://localhost:8085/velochatx/
```

接入 NitroWater（替代当前 `deploy/plugin-docs` 的 bind mount）时，`docs` 服务从 `nginx:stable-alpine + 卷挂载` 改为直接使用本镜像：

```yaml
docs:
  image: nitrowater-plugin-docs:local   # 或 ghcr.io/<owner>/nitrowater-plugin-docs:latest
  container_name: nitrowater-docs
  ports: ["127.0.0.1:8085:80"]
  networks: [nitrowater-net]
```

**路由注意**：文档现在位于根级 `/<id>/`，不再是 `/plugin/<id>/docs/`。NitroWater 侧负责把 `/<id>/**` 转发到 docs 容器（BFF 路由或反向代理），并为每个插件登记入口；`/` 与门户 SPA 路由（`/plugins`、`/login` 等）的命名空间需要避让。

发布新文档 = 重打镜像 + `docker compose up -d docs`；回滚 = 切回上一个镜像 tag。

## 与 `webs/velochatx-docs` 的关系

本仓的 `plugins/velochatx/docs/` 是 `velochatx-docs` 内容的迁移副本，之后 **以本仓为准**。
`velochatx-docs` 继续作为其独立 GitHub Pages 站点时，需要保持 `VITEPRESS_BASE` 兼容（该站点原有默认 base 为 `/VeloChatX-Docs/`）。

## 长周期约定

- AI 协作流、编码与验证规则见 [AGENTS.md](./AGENTS.md)。
- 项目理解与当前进度见 `.ai/PROJECT.md`、`.ai/context/current.md`。
