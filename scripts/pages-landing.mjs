#!/usr/bin/env node
/**
 * GitHub Pages 专用根导航。
 *
 * 只在 Pages 发布流程中、`npm run build` 之后执行；Docker 镜像仍然不生成根首页
 * （`/` 保持 404，入口由 NitroWater 门户负责）。
 *
 * 约定：
 *   - 产物根目录 = Pages 站点根 = `/<repo>/`
 *   - 每个插件在 `<id>/` 下，链接使用 `/<repo>/<id>/`
 *   - 同时生成 404.html，缺失路径可回到导航
 *
 * 用法：
 *   DOCS_BASE_PREFIX=nitrowater-plugin-docs node scripts/pages-landing.mjs
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDir = path.join(root, 'plugins')
const outDir = path.resolve(root, process.env.DOCS_OUT_ROOT ?? 'dist')
const prefix = (process.env.DOCS_BASE_PREFIX ?? '').replace(/^\/+|\/+$/g, '')
const base = prefix ? `/${prefix}/` : '/'

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  )

async function readPlugins() {
  const entries = await readdir(pluginsDir, { withFileTypes: true })
  const plugins = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metaPath = path.join(pluginsDir, entry.name, 'plugin.json')
    if (!existsSync(metaPath)) continue
    const meta = JSON.parse(await readFile(metaPath, 'utf8'))
    plugins.push({
      ...meta,
      hasEnglish: existsSync(path.join(pluginsDir, entry.name, 'docs', 'en', 'index.md')),
    })
  }
  return plugins.sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id))
}

const pluginCard = (plugin) => {
  const href = `${base}${plugin.id}/`
  const english = plugin.hasEnglish
    ? `<a class="button ghost" href="${escapeHtml(href)}en/">English</a>`
    : ''
  const repo = plugin.repo
    ? `<a class="repo" href="${escapeHtml(plugin.repo)}" target="_blank" rel="noopener">GitHub ↗</a>`
    : ''
  const description = plugin.description
    ? `<p class="description">${escapeHtml(plugin.description)}</p>`
    : ''
  const descriptionEn = plugin.descriptionEn
    ? `<p class="description en">${escapeHtml(plugin.descriptionEn)}</p>`
    : ''

  return `
      <article class="card">
        <div class="card-head">
          <h2>${escapeHtml(plugin.name ?? plugin.id)}</h2>
          ${repo}
        </div>
        ${description}
        ${descriptionEn}
        <div class="actions">
          <a class="button" href="${escapeHtml(href)}">中文文档</a>
          ${english}
        </div>
      </article>`
}

const plugins = await readPlugins()
const cards = plugins.map(pluginCard).join('')

const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NitroWater 插件文档</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #ffffff;
      --fg: #1f2328;
      --muted: #656d76;
      --card: #f6f8fa;
      --border: #d0d7de;
      --brand: #3451b2;
      --brand-fg: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1b1b1f;
        --fg: #dfdfd6;
        --muted: #98989f;
        --card: #202127;
        --border: #2e2e32;
        --brand: #a8b1ff;
        --brand-fg: #1b1b1f;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: var(--bg);
      color: var(--fg);
      font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC",
        "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 64px 24px 80px;
    }
    header { text-align: center; margin-bottom: 48px; }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(32px, 5vw, 48px);
      letter-spacing: -0.02em;
    }
    .subtitle { margin: 0; color: var(--muted); font-size: 18px; }
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 20px 18px;
      display: flex;
      flex-direction: column;
    }
    .card-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    .card h2 { margin: 0; font-size: 22px; }
    .repo { color: var(--muted); font-size: 13px; text-decoration: none; white-space: nowrap; }
    .repo:hover { color: var(--brand); }
    .description { margin: 12px 0 0; }
    .description.en {
      margin-top: 6px;
      color: var(--muted);
      font-size: 14px;
    }
    .actions { display: flex; gap: 10px; margin-top: auto; padding-top: 18px; }
    .button {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 8px;
      background: var(--brand);
      color: var(--brand-fg);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
    }
    .button.ghost {
      background: transparent;
      color: var(--brand);
      border: 1px solid var(--border);
    }
    .button:hover { opacity: 0.88; }
    footer {
      margin-top: 56px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    footer a { color: inherit; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>NitroWater 插件文档</h1>
      <p class="subtitle">NitroWater Plugin Documentation</p>
    </header>
    <section class="grid">${cards}
    </section>
    <footer>
      <p>入口由 NitroWater 门户统一管理 · <a href="https://github.com/Danburen/nitrowater-plugin-docs">GitHub</a></p>
    </footer>
  </main>
</body>
</html>
`

const notFound = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>页面不存在 - NitroWater 插件文档</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #fff;
      color: #1f2328;
      font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC",
        "PingFang SC", "Microsoft YaHei", sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #1b1b1f; color: #dfdfd6; }
      a { color: #a8b1ff; }
    }
    main { text-align: center; padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 40px; }
    p { margin: 0 0 20px; opacity: 0.72; }
  </style>
</head>
<body>
  <main>
    <h1>404</h1>
    <p>这个页面不存在，可能是链接过期或路径拼写有误。</p>
    <a href="${escapeHtml(base)}">返回文档导航</a>
  </main>
</body>
</html>
`

await writeFile(path.join(outDir, 'index.html'), page, 'utf8')
await writeFile(path.join(outDir, '404.html'), notFound, 'utf8')

console.log(`[pages] 根导航 -> ${path.relative(root, path.join(outDir, 'index.html'))}`)
console.log(`[pages] 404 页面 -> ${path.relative(root, path.join(outDir, '404.html'))}`)
for (const plugin of plugins) {
  console.log(`[pages]   ${base}${plugin.id}/`)
}
