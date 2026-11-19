# 快速开始

## 安装插件

### 前置准备

| 项目 | 要求 |
|---|---|
| [Velocity](https://docs.papermc.io/velocity/) | 推荐 3.3.0 及以上 |
| Java | 17 及以上 |
| [LuckPerms for Velocity](https://luckperms.net/download) | 推荐 5.4+，用于前缀/后缀/组别与权限 |
| [VeloChatX](https://github.com/Danburen/VeloChatX/releases) | 推荐 2.1.0 及以上 |

> [!NOTE]
> LuckPerms 不是启动插件的硬性依赖，但没有它就无法获取 `{prefix}`、`{suffix}`、`{group}`，也无法给玩家/管理员授权。

### 安装步骤

1. 将 `VeloChatX-x.x.x.jar` 放入 Velocity 的 `plugins/` 目录；
2. 启动代理服，等待控制台出现插件启用信息；
3. 停止服务器，按需编辑 `plugins/VeloChatX/` 下的配置文件；
4. 再次启动，执行 `/vcx status` 检查服务器绑定与频道是否正常。

## 生成的文件

2.1 首次启动后，插件目录大致如下：

```text
plugins/VeloChatX/
├─ config.yml          # 主配置（聊天、频道、Tab、违禁词、更新检查等）
├─ broadcast.yml       # 定时广播 + 玩家进出广播
├─ message.yml         # 玩家可见消息（可自定义）
├─ data.db.mv.db       # H2 玩家数据库（屏蔽列表、聊天开关等）
└─ bak/                # 执行 config update / migration 时的备份
```

- `config.yml`：绝大部分功能在这里配置，见[主配置](/guide/config/main)与[跨服聊天与频道配置](/guide/config/cross-server-chat)。
- `broadcast.yml`：定时广播见[定时广播配置](/guide/config/active-broadcast)，玩家进出广播见[玩家进出广播配置](/guide/config/passive-broadcast)。
- `message.yml`：提及、私聊、屏蔽、违禁词等玩家可见文本；**键不能删除或改名**，值可以修改。
- `data.db.mv.db`：玩家数据与屏蔽关系，删除后会丢失所有玩家的屏蔽列表与聊天开关状态。
- `bak/`：只有执行过配置更新/迁移后才会出现，内含最近一次被覆盖前的配置备份。
- `system-message/*.yml`：命令帮助、状态输出、绑定诊断等管理员文本，打包在 jar 内，不会生成到插件目录。

> [!WARNING]
> 如果目录结构与上面不一致，可能仍在使用 2.0 或更早版本，建议升级到 2.1+。

## 第一次配置建议

1. **确认服务器 ID**：`velocity.toml` 的 `[servers]`、`config.yml` 的 `server.list`、`channels.channel-list` 三处保持一致（区分大小写）。
2. **配置显示名与频道**：参照[跨服聊天与频道配置](/guide/config/cross-server-chat)。
3. **决定是否全服互通**：`channels.global: true` 表示所有服务器互通；`false` 表示只允许同频道互通。
4. **按需开启广播**：定时广播默认开启，可在 `broadcast.yml` 中调整间隔与内容。
5. **验证**：执行 `/vcx status`，确认没有 `PHANTOM` 服务器，且频道成员符合预期。

## 启动并运行

配置完成后即可启动服务器。常用维护命令：

```text
/vcx help                  # 查看你有权限使用的指令
/vcx status                # 服务器绑定、频道与广播统计
/vcx show-channel-info     # 查看频道及在线人数
/vcx reload                # 重载全部配置并重排定时任务
```

完整的指令与权限说明见[权限和指令](/reference/cmdsAndPerms)，配置文件升级与迁移见[配置维护与升级](/guide/config/maintenance)。
