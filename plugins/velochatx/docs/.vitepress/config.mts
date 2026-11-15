import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { zhThemeConfig } from './theme/zh'
import { enThemeConfig } from './theme/en'

interface PluginMeta {
  id: string
  name: string
  description?: string
  repo?: string
}

// 站点根 = plugins/<id>/docs/.vitepress，插件元数据 = plugins/<id>/plugin.json
const here = dirname(fileURLToPath(import.meta.url))
const pluginRoot = resolve(here, '../..')
const plugin = JSON.parse(
  readFileSync(resolve(pluginRoot, 'plugin.json'), 'utf8'),
) as PluginMeta

/** `/plugin` | `plugin/` | `/` -> 去掉首尾斜杠 */
const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '')

/** 任意前缀 -> VitePress 要求的 base 形式：以 `/` 开头并以 `/` 结尾 */
const toBase = (value: string): string => {
  const trimmed = trimSlashes(value)
  return trimmed ? `/${trimmed}/` : '/'
}

// 部署前缀：默认根级，即每个插件直接占一级路径 /<id>/。
// 需要挂到子路径时用 DOCS_BASE_PREFIX=/some-prefix 覆盖。
const prefix = trimSlashes(process.env.DOCS_BASE_PREFIX ?? '')

// 最终 base 必须等于"该插件文档的 URL 前缀"，默认即 /<id>/（如 /velochatx/）。
// VITEPRESS_BASE 仍然可用（兼容旧流水线），优先级最高。
const base = process.env.VITEPRESS_BASE
  ? toBase(process.env.VITEPRESS_BASE)
  : toBase([prefix, plugin.id].filter(Boolean).join('/'))

// 构建产物：默认 dist/<prefix>/<id>/，与 URL 结构一一对应，nginx 可直接以 dist 为根。
const outDir =
  process.env.DOCS_OUT_DIR ??
  resolve(here, '../../../..', 'dist', prefix, plugin.id)

export default defineConfig({
  title: plugin.name,
  description: plugin.description ?? `${plugin.name} documentation`,
  base,
  outDir,
  // 契约：产物保留 `.html` 后缀，深层页面是真实文件，便于 nginx/BFF 做静态托管。
  cleanUrls: false,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg` }],
    ['meta', { name: 'nitrowater-plugin', content: plugin.id }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: plugin.repo
      ? [{ icon: 'github', link: plugin.repo }]
      : [],
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: zhThemeConfig,
    },
    en: {
      label: 'English',
      lang: 'en-US',
      themeConfig: enThemeConfig,
    },
  },
  search: {
    provider: 'local',
  },
})
