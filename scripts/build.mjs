#!/usr/bin/env node
/**
 * 构建所有插件文档到 dist/<id>/，URL 与磁盘一一对应：
 *
 *   dist/<id>/index.html  ->  /<id>/
 *
 * 本仓只做聚合：不生成门户首页、不生成清单，入口统一由 NitroWater 门户提供。
 *
 * 用法：
 *   npm run build                      # 全部插件，默认根级 /<id>/
 *   npm run build:velochatx            # 只构建一个
 *   DOCS_BASE_PREFIX=/docs npm run build   # 需要时挂到子路径 -> /docs/<id>/
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDir = path.join(root, 'plugins')
const distDir = path.join(root, 'dist')
const vitepressBin = path.join(root, 'node_modules', 'vitepress', 'bin', 'vitepress.js')

const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, '')
const prefix = trimSlashes(process.env.DOCS_BASE_PREFIX ?? '')
const urlPrefix = prefix ? `/${prefix}/` : '/'
const webRoot = path.join(distDir, prefix)

const only = new Set(process.argv.slice(2))

async function readPlugins() {
  const entries = await readdir(pluginsDir, { withFileTypes: true })
  const plugins = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metaPath = path.join(pluginsDir, entry.name, 'plugin.json')
    if (!existsSync(metaPath)) continue
    const meta = JSON.parse(await readFile(metaPath, 'utf8'))
    if (only.size > 0 && !only.has(meta.id)) continue
    plugins.push(meta)
  }
  return plugins.sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id),
  )
}

function runVitePress(args, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [vitepressBin, ...args], {
      cwd: root,
      env,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`vitepress ${args.join(' ')} exited with code ${code}`))
    })
  })
}

const plugins = await readPlugins()
if (plugins.length === 0) {
  console.error(`[build] 没有找到可构建的插件（plugins/*/plugin.json）${only.size ? `，筛选：${[...only].join(', ')}` : ''}`)
  process.exit(1)
}
if (!existsSync(vitepressBin)) {
  console.error('[build] 缺少 vitepress，请先执行 npm install')
  process.exit(1)
}

await rm(distDir, { recursive: true, force: true })
await mkdir(webRoot, { recursive: true })

for (const plugin of plugins) {
  const siteDir = path.join(pluginsDir, plugin.id, 'docs')
  const outDir = path.join(webRoot, plugin.id)
  const base = `${urlPrefix}${plugin.id}/`
  console.log(`\n[build] ${plugin.id} -> ${base} (out: ${path.relative(root, outDir)})`)
  await runVitePress(['build', siteDir], {
    ...process.env,
    DOCS_BASE_PREFIX: prefix ? `/${prefix}` : '/',
    VITEPRESS_BASE: base,
    DOCS_OUT_DIR: outDir,
  })
}

console.log(`\n[build] 完成：${plugins.length} 个站点 -> ${path.relative(root, distDir)}`)
for (const plugin of plugins) {
  console.log(`[build]   ${urlPrefix}${plugin.id}/`)
}
