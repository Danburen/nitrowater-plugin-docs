# 权限和指令

本页介绍 VeloChatX 的指令、别名与权限节点。

主指令支持以下别名，效果完全一致：

```text
/velochatx
/vcx
/vc
/chatx
```

> [!TIP]
> `/vcx help` 无需任何权限，任何玩家（包括控制台）都可以使用，并且只会列出**你有权限执行**的子指令。
> 指令补全同样会按权限过滤，没有权限时不会枚举在线玩家名字。

## 玩家指令

以下指令面向玩家；除 `/vcmsg` 也可从控制台执行外，其余都需要玩家身份并在**游戏内**执行。

| 指令 | 别名 | 说明 | 权限节点 |
|---|---|---|---|
| `/mention <玩家>` | `/men`、`/at` | 提及某个玩家：对方会收到提示消息，可选屏幕标题与提示音 | `velochatx.player.mention` |
| `/vcmsg <玩家> <消息...>` | `/vctell` | 向某个玩家发送跨服私聊 | `velochatx.player.vcmsg` |
| `/vcx on` | - | 开启自己的跨服聊天接收/转发 | `velochatx.player.on` |
| `/vcx off` | - | 关闭自己的跨服聊天接收/转发 | `velochatx.player.off` |
| `/vcx block <玩家>` | - | 屏蔽某个玩家 | `velochatx.player.block` |
| `/vcx unblock <玩家>` | - | 取消屏蔽某个玩家 | `velochatx.player.unblock` |
| `/vcx list [block]` | - | 查看自己已屏蔽的玩家列表 | `velochatx.player.list` |

### 提及 `/mention <玩家>` {#mention-command}

- 发送者会看到「你提及了谁」，被提及者会看到「谁提及了你」；
- 若开启 `mention-show-title`，被提及者屏幕中央还会显示标题；
- 会播放一次提示音；
- 被提及者如果屏蔽了你，你会看到“已发送”，但对方不会收到（静默屏蔽）。

### 私聊 `/vcmsg <玩家> <消息...>` {#message-command}

- 消息只会在发送者与接收者之间显示；
- 支持从控制台执行：控制台作为发送者，名称使用 `server.proxy` 的显示名；
- 消息文本会作为一整段处理，可以包含空格；
- 同样受屏蔽列表影响：
  - 对方屏蔽了你：你看到“已发送”，对方收不到；
  - 你屏蔽了对方：消息会被静默丢弃。

### 跨服聊天开关 `/vcx on|off`

- 关闭后，你不再接收其他服务器的聊天消息，你的消息也不会转发到其他服务器；
- 状态保存在插件数据库中，重连后保持；
- 不影响你使用私聊、提及与定时广播。

### 屏蔽 `/vcx block|unblock <玩家>` 与列表 `/vcx list`

`/vcx block <玩家>` 后：

- 你不再收到该玩家的跨服聊天、提及与私聊；
- 该玩家不会收到“被屏蔽”的提示（静默屏蔽）；
- 你主动向对方发私聊时，消息会被静默丢弃；
- 屏蔽关系保存在数据库，代理服重启后仍然有效。

`/vcx list` 等价于 `/vcx list block`，列出你已屏蔽的玩家；没有记录时会提示列表为空。

## 管理员指令

### 玩家与控制台都能执行

| 指令 | 说明 | 权限节点 |
|---|---|---|
| `/vcx status` | 显示服务器绑定、频道、广播统计与绑定问题 | `velochatx.admin.status` |
| `/vcx show-channel-info` | 列出所有频道及其在线人数 | `velochatx.admin.show-channel-info` |
| `/vcx reload` | 重载全部配置，并重排定时任务、重新检查绑定 | `velochatx.admin.reload` |
| `/vcx config reload [config\|message\|broadcast\|all]` | 只重载指定配置文件 | `velochatx.admin.config` |
| `/vcx config diff [config\|message\|broadcast\|all]` | 只读查看与内置模板的差异 | `velochatx.admin.config` |
| `/vcx config update [config\|message\|broadcast\|all]` | 补齐缺失键（保留自定义值/注释，写前备份） | `velochatx.admin.config` |
| `/vcx config migration [config\|message\|broadcast\|all] [--dry-run]` | 把旧结构迁移到当前结构 | `velochatx.admin.config` |

配置相关命令的细节见[配置维护与升级](/guide/config/maintenance)。

### 仅游戏内执行

| 指令 | 说明 | 权限节点 |
|---|---|---|
| `/vcx placeholder <文本>` | 解析整段文本中的占位符并显示结果 | `velochatx.admin.placeholder` |

`placeholder` 会把**整行剩余内容**作为模板，不局限于一个参数，例如：

```text
/vcx placeholder 你好 {player}，你在 {server}，当前频道 {channel}
```

> [!NOTE]
> `placeholder` 需要玩家上下文才能解析玩家类占位符，因此只能游戏内使用。
> `/vcx status` 输出中的“已注册/未注册”指的是「配置声明」与「Velocity 已注册」的对比，不是服务器进程的存活状态。

## 权限模型

插件权限树以 `velochatx` 为根，分为两个组：

```text
velochatx
├─ player        # 玩家组
│  ├─ mention
│  ├─ vcmsg
│  ├─ on / off
│  ├─ block / unblock
│  └─ list
└─ admin         # 管理组
   ├─ status
   ├─ show-channel-info
   ├─ placeholder
   ├─ reload
   └─ config
```

每个子指令采用**任一满足**（any-of）的判定方式：

| 指令类型 | 满足任意一个节点即可执行 |
|---|---|
| 玩家指令 | `velochatx.player.<指令>`、`velochatx.player`、`velochatx.admin` |
| 管理指令 | `velochatx.admin.<指令>`、`velochatx.admin` |
| `help` | 无需权限 |

这意味着：

- 只给 `velochatx.player` 就能使用全部玩家指令；
- 需要精细授权时，可以只给 `velochatx.player.mention` 之类的单指令节点；
- `velochatx.admin` 会同时获得全部管理指令与玩家指令。

> [!IMPORTANT]
> Velocity 没有原版 OP 概念，权限必须通过代理端权限插件授予（推荐 LuckPerms for Velocity）。

LuckPerms 授权示例：

```text
# 给默认组玩家权限
/lpv group default permission set velochatx.player true

# 给管理组全部管理权限
/lpv group admin permission set velochatx.admin true

# 只允许某个玩家查看状态
/lpv user Steve permission set velochatx.admin.status true
```

## 常见问题

**执行指令提示“未知的命令”？**
确认使用的是 `/velochatx`、`/vcx`、`/vc` 或 `/chatx`，而不是只输入 `/velochatx` 后跟了不存在的子指令。

**提示“您无权使用该命令”？**
说明子指令存在但当前来源没有对应权限；先检查 LuckPerms 的 `velochatx.player` / `velochatx.admin`。

**控制台执行玩家指令提示“此命令只能在游戏中使用”？**
`on/off/block/unblock/list/placeholder/mention` 需要玩家身份；`vcmsg`、`status`、`show-channel-info`、`config`、`reload` 可以在控制台执行。
