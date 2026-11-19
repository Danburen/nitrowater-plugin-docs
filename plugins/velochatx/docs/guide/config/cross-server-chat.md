# 跨服聊天与频道配置

本页介绍如何把 Velocity 的后端服务器接入 VeloChatX，以及如何用频道（channel）把玩家分组。

涉及 `config.yml` 中的两个部分：

| 配置节 | 作用 |
|---|---|
| `server` | 每个后端服务器的**显示名**与**所属频道**（服务器视角） |
| `channels` | 频道的**元数据**：显示名、进入提示，以及是否全服互通（频道视角） |

## 先理解三个 ID

在开始配置前，请先确认三个地方的服务器 ID 完全一致（**区分大小写**）：

1. `velocity.toml` 中 `[servers]` 的键；
2. `config.yml` 中 `server.list` 下的键；
3. `channels.channel-list` 中 `channel-list` 下的频道名（频道名与服务器 ID 是两套命名，不要混用）。

```toml
# velocity.toml
[servers]
lobby = "127.0.0.1:25565"
server1 = "127.0.0.1:25566"
server2 = "127.0.0.1:25567"
```

## 服务器显示名与绑定

推荐使用 `server` 配置节，把「显示名」和「频道成员关系」写在同一个地方：

```yaml
server:
  # 是否启用显示名功能
  display-enable: true
  # 代理服自己的显示名，用于 {proxy}
  proxy: "[§5代理服§r]"
  list:
    lobby:
      # 显示名，用于 {server}
      display: "[§d大厅服§r]"
      # 该服务器所属的频道，可写多个
      channels:
        - login
    server1:
      display: "[§3小游戏服§r]"
      channels:
        - games
    server2:
      display: "[§2生存服§r]"
      channels:
        - survive
```

- `display-enable`：
  - `true`：启用显示名。未在 `server.list` 中声明的后端，`{server}` 会显示为 `[原始ID]`；
  - `false`：`{server}` 直接显示原始 ID。
- `proxy`：`{proxy}` 的输出内容，也会在控制台通过 `/vcmsg` 发私聊时作为发送者名称。
- `list.<id>.display`：该服务器的显示名。可以带颜色代码，也可以自己加括号；插件不会重复包裹。
- `list.<id>.channels`：该服务器加入的频道列表，可以写一个或多个。频道的显示名与提示在 `channels` 中配置。

> [!WARNING]
> `list.<id>.channels` 里的频道名必须存在于 `channels.channel-list` 中；不存在的频道名会被忽略，`{channel}` 也会为空。

> [!WARNING]
> `server.list` 的键必须与 `velocity.toml` 的 `[servers]` 键完全一致。
> 写错大小写会变成“声明了但 Velocity 中不存在”的 `PHANTOM` 服务器，永远不会匹配到真实后端。

### 未声明的服务器会怎样

- `display-enable: true`：显示为 `[原始ID]`；
- `display-enable: false`：显示原始 ID；
- `{channel}` 为空字符串（该服务器没有加入任何频道）；
- 启动时会在控制台给出绑定提示，可用 `/vcx status` 查看。

## 频道与聊天隔离

频道本身只需要配置「显示什么」和「进入时提示什么」，成员关系写在 `server.list` 中：

```yaml
channels:
  # true：所有服务器互相通信，频道只影响显示
  # false：只有同一频道内的服务器可以互相通信
  global: true

  channel-list:
    login:
      display: "[§6登录频道§r]"
      welcome:
        enable: true
        message: "欢迎加入登录频道"
    games:
      display: "[§6小游戏频道§r]"
      welcome:
        enable: true
        message: "欢迎加入小游戏频道"
    survive:
      display: "[§6生存频道§r]"
      welcome:
        enable: true
        message: "欢迎加入生存频道"
```

- `global: true`：任何服务器之间的跨服聊天都会互相转发，频道只用于 `{channel}` 显示和频道提示。
- `global: false`：只有**同属至少一个共同频道**的服务器之间才会转发消息。
  - 没有加入任何频道的服务器无法与其他服务器通信，启动时会给出警告。
  - 跨服私聊与提及不受频道限制，始终可用。
- `display`：频道显示名，用于 `{channel}` 与 `/vcx show-channel-info`。
- `welcome`：玩家进入该频道的子服时，向他本人发送的提示消息：
  - `enable`：是否发送；
  - `message`：提示文本，支持占位符。

> [!NOTE]
> 一个服务器可以属于多个频道。此时 `{channel}` 会显示**配置中第一个匹配到的频道**。
> 判断两个服务器能否通信时，只要它们有任意一个共同频道即可。

## 旧版配置兼容与迁移

2.0 及更早版本的写法是「频道里列出服务器」：

```yaml
server-display:
  enable: true
  proxy: "[§5代理服§r]"
  display:
    lobby: "[§d大厅服§r]"

channels:
  channel-list:
    login:
      servers:
        - lobby
```

2.1 起推荐使用前面的 `server.list` 结构。为了平滑升级，插件保留了对旧键的读取：

- `server-display.display.<id>` **逐项优先**于 `server.list.<id>.display`；
- `server-display.proxy` 优先于 `server.proxy`；
- `server-display.enable` 优先于 `server.display-enable`；
- 只要**任意一个** `channels.channel-list.<频道>.servers` 是非空列表，就整体按旧模式处理：
  - `server.list.*.channels` 会被**整体忽略**；
  - 成员关系以 `channel-list.*.servers` 为准；
  - 每个服务器的 `display` 仍然逐项生效。

> [!TIP]
> 新旧写法混用容易产生“改了新键却不生效”的困惑。
> 确认配置后执行一次 `/velochatx config migration config`，插件会把旧键迁移到新结构并删除旧键。

## 启动检查与 `/vcx status`

插件启动时会检查服务器绑定、频道成员和 Velocity 的注册情况，并在控制台输出问题。管理员也可以随时执行：

```text
/velochatx status
```

输出包含：

- 已声明的服务器数量、Velocity 已注册/未注册数量；
- 频道数量；
- 广播消息数量（全局 / 分区）；
- 每个服务器的绑定状态：

| 状态 | 含义 | 处理建议 |
|---|---|---|
| `BOUND` | 配置中声明了，且 Velocity 中存在 | 正常 |
| `UNBOUND` | Velocity 中存在，但配置中没有声明 | 补充 `server.list`，或忽略（会显示原始 ID） |
| `PHANTOM` | 配置中声明了，但 Velocity 中不存在 | 检查 ID 拼写与大小写 |

常见提示与含义：

- **频道引用了不存在的服务器**：该成员会被丢弃，`{channel}` 可能为空；
- **频道校验后为空**：该频道没有有效成员；
- **服务器不属于任何频道**：当 `global: false` 时它无法参与跨服聊天；
- **检测到旧版绑定配置**：建议执行配置迁移。

> [!TIP]
> `/vcx show-channel-info` 会列出所有频道及其在线人数；频道人数统计的是该频道内所有子服的玩家总数。
