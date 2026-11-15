#!/usr/bin/env node
/**
 * 本地开发：每个插件一个 VitePress dev server（各自带自己的 base）。
 *
 * 用法：
 *   npm run dev                  # 所有插件，端口 5173 起
 *   npm run dev:velochatx        # 只起一个
 *   DOCS_BASE_PREFIX=/ npm run dev
 *
 * 访问示例：http://localhost:5173/velochatx/
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDir = path.join(root, 'plugins')
const vitepressBin = path.join(root, 'node_modules', 'vitepress', 'bin', 'vitepress.js')

const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, '')
const prefix = trimSlashes(process.env.DOCS_BASE_PREFIX ?? '')
const urlPrefix = prefix ? `/${prefix}/` : '/'
const only = new Set(process.argv.slice(2))
const basePort = Number(process.env.DOCS_DEV_PORT ?? 5173)

if (!existsSync(vitepressBin)) {
  console.error('[dev] 缺少 vitepress，请先执行 npm install')
  process.exit(1)
}

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
plugins.sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.id.localeCompare(b.id))

if (plugins.length === 0) {
  console.error('[dev] 没有找到可启动的插件')
  process.exit(1)
}

const children = []
plugins.forEach((plugin, index) => {
  const port = basePort + index
  const base = `${urlPrefix}${plugin.id}/`
  console.log(`[dev] ${plugin.id.padEnd(12)} http://localhost:${port}${base}`)
  const child = spawn(
    process.execPath,
    [vitepressBin, 'dev', path.join(pluginsDir, plugin.id, 'docs'), '--port', String(port)],
    {
      cwd: root,
      env: {
        ...process.env,
        DOCS_BASE_PREFIX: prefix ? `/${prefix}` : '/',
        VITEPRESS_BASE: base,
      },
      stdio: 'inherit',
    },
  )
  children.push(child)
})

let shuttingDown = false
const shutdown = (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) child.kill(signal)
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal))
process.on('exit', () => shutdown('SIGTERM'))
