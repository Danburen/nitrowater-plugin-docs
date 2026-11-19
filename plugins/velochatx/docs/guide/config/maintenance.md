# 配置维护与升级

本页介绍 `config.yml` / `broadcast.yml` / `message.yml` 的版本、备份、差异查看、自动补键与结构迁移。
这些能力用于让旧服务器的配置在升级插件后继续可用，不需要每次手工对照模板。

## 配置文件与版本

插件首次启动会在 `plugins/VeloChatX/` 下生成：

```text
.
├─ config.yml            # 主配置
├─ broadcast.yml         # 定时广播、玩家进出广播
├─ message.yml           # 玩家可见消息（可自定义）
├─ data.db.mv.db         # H2 玩家数据库（屏蔽列表、聊天开关等）
└─ bak/                  # 执行 update / migration 时的备份目录
```

每个可维护的配置文件都带有：

```yaml
config-version: 2.1.0
```

- `config-version` 表示该文件的结构版本，由插件用于判断是否需要补齐键或迁移结构；
- 通常**不需要手动修改**；
- 插件内置消息文件（`system-message/*.yml`）打包在 jar 内，不会生成到插件目录。

> [!WARNING]
> 在手动大改配置或升级前，建议先完整备份整个 `plugins/VeloChatX/` 目录。

## 查看差异 `config diff`

只读命令，不会修改任何文件：

```text
/velochatx config diff [config|message|broadcast|all]
```

输出会按文件列出与插件内置模板的差异：

| 标记 | 含义 |
|---|---|
| 新增（ADDED） | 你文件里有、模板里没有的键（通常是自定义内容） |
| 缺失（REMOVED） | 模板里有、你文件里没有的键（`config update` 会补上） |
| 变更（CHANGED） | 两边都有但值不同（通常是你的自定义值，`update` 不会覆盖） |

> [!TIP]
> `diff` 与 `update` 使用同一份磁盘文件作为依据，所以“diff 里看到的缺失键”就是 update 会补的键。

## 补齐缺失键 `config update`

```text
/velochatx config update [config|message|broadcast|all]
```

行为：

1. 先执行该文件**待应用的结构迁移**（如果有）；
2. 再补齐模板中存在、而你文件中缺失的键；
3. 保留你已有的值、注释与键顺序；
4. 写入前把原文件备份到 `bak/<文件名>.bak`（覆盖上一次备份）；
5. 成功后自动重载该文件。

> [!IMPORTANT]
> `update` 只做“补键”，不负责把旧结构改造成新结构。
> 例如 `server-display.display` → `server.list` 这种结构变化，需要用 `config migration`。

没有任何可补的键时，会直接提示无需更新。

## 迁移旧结构 `config migration`

```text
/velochatx config migration [config|message|broadcast|all] [--dry-run]
```

当前内置的迁移：

| 文件 | 迁移内容 |
|---|---|
| `config.yml` | `server-display.*` → `server.*`；`channels.channel-list.*.servers` → `server.list.*.channels`；清理已废弃键 |
| `broadcast.yml` | `join-leave-broadcast` / `join-leave-proxy-broadcast` → `entry-broadcast` |

参数：

- `--dry-run`：只预览会迁移哪些文件、从哪个版本到哪个版本，**不写盘**；
- 不写文件时不产生备份；正式迁移会先备份到 `bak/`；
- 迁移只写入尚不存在的目标键，已经是新结构的文件不会被重复改写。

推荐流程：

```text
/velochatx config migration all --dry-run
/velochatx config migration all
/velochatx config update all
/velochatx reload
```

> [!TIP]
> 迁移后如果提示仍有缺失键，再执行一次 `config update` 即可。

## 热重载

| 命令 | 作用 |
|---|---|
| `/velochatx reload` | 重载**全部**配置，并重排定时广播 / Tab 列表任务，同时重新执行服务器绑定检查 |
| `/velochatx config reload config` | 只重载主配置 |
| `/velochatx config reload message` | 只重载 `message.yml`（同时刷新内置系统消息） |
| `/velochatx config reload broadcast` | 只重载 `broadcast.yml` |
| `/velochatx config reload all` | 重载全部配置文件，但**不会**重排定时任务 |

> [!NOTE]
> 修改了 `broadcast.interval`、`tab-list.interval` 这类“注册任务时读取一次”的值时，请使用 `/velochatx reload`；
> 只执行 `config reload` 不会重排已注册的定时任务。

## 启动时的自动提示

插件启动时会自检配置文件，并在控制台汇总提示：

- **版本落后**：磁盘上的 `config-version` 低于插件内置版本；
- **缺失键**：模板中存在但文件中没有；
- **待迁移**：检测到旧结构，且存在可执行的迁移；
- **配置版本高于插件**：说明配置文件来自更新的插件版本，此时不建议降级使用。

提示会直接给出建议命令（`config update` 或 `config migration <文件>`）。
这些检查与 `check-update.enable` 无关，即使关闭自动更新也会执行。

## 从 2.0 升级到 2.1

建议按以下顺序操作：

1. **停止代理服**，备份整个 `plugins/VeloChatX/`；
2. 替换为 2.1.x 的 jar 并启动一次，让插件读取旧配置；
3. 执行 `/velochatx config migration all`（可先加 `--dry-run` 预览）；
4. 执行 `/velochatx config update all` 补齐新增键；
5. 执行 `/velochatx reload` 或重启；
6. 用 `/velochatx status` 检查服务器绑定与频道是否正常。

升级时需要特别注意：

- 玩家进出广播已从旧键迁移到 `broadcast.yml` 的 `entry-broadcast`；
- 服务器显示名与频道成员关系统一到 `server.list.<id>.{display,channels}`；
- 自定义消息仍然写在 `message.yml`；`system-message/*.yml` 为插件内置，通常不需要改动；
- 旧的分散语言文件不再使用，若你曾自定义过，请把内容合并到 `message.yml`（玩家消息）中。

> [!TIP]
> 迁移/补键后如果某个自定义消息没有生效，先用 `/velochatx config diff message` 确认该键是否仍然存在于模板中。
