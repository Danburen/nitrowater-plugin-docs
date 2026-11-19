# 玩家进出广播配置

以下配置均在 `broadcast.yml` 中找到并修改。

本页介绍由**玩家行为触发**的广播：进入/离开代理服、进入/离开后端服务器、切换频道，以及玩家首次进入时的欢迎消息。
如果你想配置固定间隔的定时广播，请转到[定时广播配置](/guide/config/active-broadcast)。

## 层级进出广播 `entry-broadcast`

2.1 起，玩家进出消息统一由 `entry-broadcast` 管理：

```yaml
entry-broadcast:
  # 是否在终端输出这些进出消息
  log-to-console: true
  # true：同一次移动只发送优先级最高的一层消息
  # false：按层级分别发送
  hierarchical-overlay: true

  # 后端服务器层面的进入/离开
  backend:
    enable: true
    scope: server
    join-message: "§a(+)§r{Group}{Prefix}{Player}{Suffix} 加入了 {channel}{Server}"
    leave-message: "§c(-)§r{Group}{Prefix}{Player}{Suffix} 离开了 {channel}{Server}"

  # 切换频道时的进入/离开
  channel:
    enable: true
    scope: channel
    join-message: "§7(+)§r{Group}{Prefix}{Player}{Suffix} 加入了 {channel}"
    leave-message: "§7(-)§r{Group}{Prefix}{Player}{Suffix} 离开了 {channel}"

  # 进入/离开整个代理服
  proxy:
    enable: true
    scope: proxy
    join-message: "§7[+]§r{Group}{Prefix}{Player}{Suffix} 加入了 {Proxy}"
    leave-message: "§7[-]§r{Group}{Prefix}{Player}{Suffix} 离开了 {Proxy}"
```

### 三类消息的触发时机

| 配置块 | 触发时机 | 发送范围 |
|---|---|---|
| `proxy` | 玩家登录代理服 / 断开与代理服的连接 | 始终广播给全代理 |
| `channel` | 玩家从 A 频道切换到 B 频道 | 由 `scope` 决定 |
| `backend` | 玩家进入 / 离开某个后端服务器 | 由 `scope` 决定 |

一次移动可能同时满足多个层级。例如玩家从「登录服」切到「生存服」，同时跨越了频道：

- `hierarchical-overlay: true`：只发送优先级更高的**频道**消息，不再发送后端进出消息；
- `hierarchical-overlay: false`：频道消息与后端消息都会发送。

优先级从高到低为：**频道切换 > 后端进出**。`proxy` 的登录/断开与它们相互独立，不受 `hierarchical-overlay` 影响。

> [!NOTE]
> 玩家首次连入代理服时，通常会同时触发 `proxy` 的加入消息和一次 `backend` 的加入消息。
> 如果不希望重复，可以关闭其中一个 `enable`，或把 `hierarchical-overlay` 设为 `true` 并只保留需要的层级。

### `scope`：消息发给谁

`backend` 与 `channel` 的 `scope` 支持：

| 值 | 说明 |
|---|---|
| `server` | 只发给目标后端服务器（加入的新服 / 离开的旧服） |
| `channel` | 发给目标服务器所属频道内的所有服务器 |
| `proxy` | 发给整个代理服的所有玩家 |

`proxy` 块的进出消息固定发送给全代理，配置中的 `scope: proxy` 仅用于保持结构一致。

### 消息模板

`join-message` / `leave-message` 支持聊天格式中的占位符，例如：

- `{Player}`、`{Prefix}`、`{Suffix}`、`{Group}`：从玩家信息解析；
- `{Server}`、`{channel}`：从**消息所属的服务器**解析（加入时是新服，离开时是旧服）；
- `{Proxy}`：代理服显示名。

> [!WARNING]
> 不要把进/离消息的“前缀”单独拆成旧版的 `join-prefix` / `player-join-message`。
> 2.1 已合并为一条完整模板；旧键会由 `config migration` 自动转换。

## 欢迎消息 `welcome-broadcast`

```yaml
welcome-broadcast:
  enable: true
  # 是否只在玩家第一次进入代理服时发送
  only-first-join: false
  message: "欢迎加入§5群组§r!"
```

- `enable`：是否发送欢迎消息。
- `only-first-join`：
  - `false`：每次登录都发送；
  - `true`：只有当玩家在数据库中**第一次出现**时发送。
- `message`：欢迎文本，支持玩家与服务器占位符。

> [!NOTE]
> 这条消息虽然叫 `broadcast`，但实际只发送给**刚进入的玩家本人**，不会广播给全服。
> “第一次加入”的判断来自插件的玩家数据库，删除数据库后会被重新视为首次加入。

## 从旧版升级

2.0 的 `join-leave-broadcast` 与 `join-leave-proxy-broadcast` 在 2.1 中已合并进 `entry-broadcast`。执行：

```text
/velochatx config migration broadcast
```

迁移会：

- 把 `join-leave-broadcast` 的开关、前缀与消息合并到 `entry-broadcast.backend`；
- 根据 `broadcast-in-channel` / `send-to-all-subServer` 推导 `scope`；
- 把 `join-leave-proxy-broadcast` 转到 `entry-broadcast.proxy`；
- 删除旧的配置节。

> [!TIP]
> 想先看会改什么，可以加 `--dry-run`：`/velochatx config migration broadcast --dry-run`。
