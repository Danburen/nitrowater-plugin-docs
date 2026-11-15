# AGENTS.md — nitrowater-plugin-docs

> 本文件是本仓 AI/人类协作的**最高优先级约定**。与全局技能（quick-understand / log-context / daily-log 等）冲突时，以本文件为准，并在答复中说明冲突。
> 最后更新：2026-11-15。

## 1. 项目是什么

NitroWater 生态的**插件文档产物仓**：多个 Minecraft 插件各有一套 VitePress 文档，本仓负责
「内容 + 构建 + 打包」，产出**静态产物 + 一个 nginx 静态镜像**；运行、路由与部署全部由下游负责。

关键点（先记住这 5 条）：

1. **一个插件 = 一次 VitePress 构建**，因为 `base` 是构建期单值；多插件靠多次构建 + nginx 合并。
2. `base` 必须**等于最终 URL 前缀**：默认根级 `/<id>/`，由 `DOCS_BASE_PREFIX`（默认空）+ 插件 id 推导。
3. Markdown 内部链接写**站点绝对路径**（`/guide/...`），**禁止**手写 `/<id>/` 前缀。
4. `cleanUrls: false`：产物是真实 `.html` 文件（产物契约，不要改）。
5. 本仓**不生成**门户首页 / 清单 / 根跳转页；`/` 就是 404，入口由下游项目负责。

## 2. 目录与事实来源

| 想找什么 | 去哪看 |
|---|---|
| 插件元数据 | `plugins/<id>/plugin.json` |
| 某插件内容 | `plugins/<id>/docs/**/*.md` |
| 站点配置（base/outDir/i18n） | `plugins/<id>/docs/.vitepress/config.mts` |
| nav/sidebar/主题 | `plugins/<id>/docs/.vitepress/theme/` |
| 构建编排 | `scripts/build.mjs` |
| 运行时 nginx 行为 | `docker/nginx.conf` |
| 镜像构建 | `Dockerfile`（+ `docker/nginx.conf`） |
| CI（构建 + 推镜像） | `.github/workflows/docs.yml` |
| 项目理解 / 进度 | `.ai/PROJECT.md`、`.ai/context/current.md` |

新增插件只动 `plugins/<id>/`（+ 必要时 `scripts` 的通用能力），**不要**为单个插件写特判。

## 3. 命令

```powershell
npm install
npm run dev                # 所有插件；或 npm run dev:<id>
npm run build              # 全部 -> dist/<id>/，URL = /<id>/
DOCS_BASE_PREFIX=/docs npm run build   # 验证子路径布局 -> /docs/<id>/
npm run preview            # VitePress preview（单插件）
npm run docker:build       # 构建交付镜像 nitrowater-plugin-docs:local
```

改完内容/配置的**最低验证**：`npm run build` 通过 + 抽查 `dist/<id>/index.html` 的资源路径以 `/<id>/` 开头。

## 4. 产物与镜像契约（改动前先读）

- 容器 root = 镜像内 `/usr/share/nginx/html` = 构建产物 `dist/`。
- 磁盘布局 = URL 布局：`/usr/share/nginx/html/<id>/...` → `/<id>/...`。
- 本仓**不提供**门户首页、清单或根跳转页：`/` 返回 404，入口由下游项目负责。
- `try_files $uri $uri/ $uri/index.html =404`：**不做 SPA fallback**，404 必须真 404。
- HTML/JSON 不缓存（发布即生效），带 hash 的静态资源长缓存。
- 需要挂到子路径时统一用 `DOCS_BASE_PREFIX` 重新构建，不要靠反向代理改写资源路径。
- 部署编排（compose / 反向代理 / 门户入口）**不在本仓**，不要在这里加回来；本仓的 CI 只负责构建并推送镜像。

## 5. 内容与编码约定

- 文档语言：中文为主，英文镜像在 `docs/en/`（保持结构一一对应）。
- 文件编码：Markdown/TS/JSON/MJS = **UTF-8 无 BOM**；行尾 LF（见 `.editorconfig`）。
  若新增 `.ps1` 脚本：**UTF-8 with BOM**（Windows PowerShell 5.1 需要）。
- 日志/上下文：UTF-8 无 BOM，schema 见 §7。
- 不要提交 `node_modules/`、`dist/`、`plugins/**/docs/.vitepress/cache`。
- `.ai/`、`.codegraph/` 当前在 `.gitignore` 中（用户选择）；若要让团队共享，需先征得用户同意再改。

## 6. CodeGraph

本仓已 `codegraph init`。定位/理解 Markdown、脚本、配置时优先：

```powershell
codegraph explore "build.mjs dev.mjs plugin.json"
```

（MCP 可用时用 `codegraph_explore`；没有 `.codegraph/` 就跳过，不要自行重建索引。）

## 7. AI 协作流（`.ai/`）

遵循 log-context skill 的新格式（≥2026-10-04）：

- `.ai/PROJECT.md`：稳定的项目理解（定位/架构/契约/目录/坑）。结构变化才更新。
- `.ai/context/current.md`：**唯一状态快照**，frontmatter 必填键不得缺失；未完成项表 status 只用枚举值。
- `.ai/context/events.log`：append-only，每行
  `<yyyy-MM-dd>T<HH:mm> | TYPE | 主题 | 变更/结论 | 证据>`，TYPE ∈ DONE/REVIEW/PLAN/BLOCKED/OPEN/DECISION/LOG/BUG。
- 本项目属于**普通日志**（`D:\Project\job\log` 下无对应项目目录），落盘在仓内 `.ai/context/`。
- 大段证据另存 `{yyyyMMdd-HHmmss}.md` 附件并在 `archive_index` 挂指针。

## 8. 常见任务清单

**加插件**：`plugin.json` → 复制一套 `.vitepress` → 改标题/nav/sidebar → `npm run dev:<id>` → `npm run build`。
**改内容**：只改 `plugins/<id>/docs/`，站内链接不带 base，图片放 `docs/public/`（引用 `/xxx.svg`）。
**改主题**：`theme/custom.css` 用 VitePress CSS 变量；跨插件通用样式先在本插件验证，再考虑抽到共享层（目前**未**抽象共享主题）。
**升级 VitePress**：改根 `package.json` → `npm install` → `npm run build` 全量验证 → 抽查中英文首页与深层页。
**排障**：
- 资源 404 / 白屏 → 检查 `base` 是否与最终 URL 前缀一致（`dist/<id>/index.html` 里应有 `/<id>/assets/...`）。
- 深层页面 404 → 检查链接是否被写成 `cleanUrls` 风格（无 `.html` 且无目录 index）。
- 镜像内 404 → 检查 `docker/nginx.conf` 的 `try_files` 与产物路径。

## 9. 不要做

- ❌ 在一个 VitePress 站点里给不同目录配不同 `base`（VitePress 不支持）。
- ❌ 在本仓生成门户首页 / 文档清单 / 根路径跳转页（入口由 NitroWater 门户负责）。
- ❌ 在 Markdown 里硬编码部署前缀或域名。
- ❌ 把文档塞进 `nitrowater-web/public/`（会让文档更新依赖前端发版）。
- ❌ 直接改 `dist/` 或用 `dist/` 作为事实来源；一切以 `plugins/**` 源码为准。
- ❌ 把构建产物、缓存、AI 临时文件提交进仓。
