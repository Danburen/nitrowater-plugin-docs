# 占位符参考

VeloChatX 提供了一组内置占位符，用于聊天格式、Tab 列表、广播与提示消息。
占位符可以写在 `config.yml`、`broadcast.yml`、`message.yml` 的文本中。

## 书写规则

- 使用 `{名称}` 包裹，例如 `{player}`；
- 也兼容 `%名称%` 写法，例如 `%player%` 等价于 `{player}`；
- 名称**不区分大小写**，`{Server}` 与 `{server}` 等价；
- 只有当前上下文能够解析的占位符才会被替换，其余保持原样或解析为空。

> [!TIP]
> 游戏内可以使用 `/vcx placeholder <文本>` 预览整段文本的解析结果（需要 `velochatx.admin.placeholder` 权限，且只能在游戏内使用）。

## 服务器类占位符

适用于广播、Tab 列表 header/footer、服务器提示等**有服务器上下文**的场景。

| 占位符 | 说明 |
|---|---|
| `{server}` | 当前服务器的显示名，由 `server.list.<id>.display` 决定 |
| `{channel}` | 当前服务器所属频道的显示名；没有频道时为空 |
| `{proxy}` | 代理服显示名，由 `server.proxy` 决定 |
| `{online}` | 当前服务器的在线人数；无法确定服务器时为 `0` |
| `{total_online}` | 整个代理服的在线人数 |

## 玩家类占位符

适用于玩家聊天、私聊、提及、Tab 列表中的玩家条目等**有玩家上下文**的场景。

| 占位符 | 说明 |
|---|---|
| `{player}` | 玩家名字 |
| `{prefix}` | 玩家前缀（来自 LuckPerms） |
| `{suffix}` | 玩家后缀（来自 LuckPerms） |
| `{group}` | 玩家所在组别（来自 LuckPerms） |
| `{ping}` | 玩家延迟，单位毫秒 |

> [!NOTE]
> `{prefix}` / `{suffix}` 会把 LuckPerms 的 `&` 颜色代码转换为 `§`，因此在聊天、Tab、广播中都能正常显示颜色。

## 动态人数占位符

| 占位符 | 说明 |
|---|---|
| `{<频道名>_channel_online}` | 指定频道的在线人数 |

例如配置了名为 `login` 的频道，就可以使用：

```text
当前登录频道在线：{login_channel_online}
```

频道名必须与 `channels.channel-list` 下的键一致；频道不存在时显示 `0`。

## 上下文限制

> [!IMPORTANT]
> - 玩家类占位符必须在**玩家上下文**中才会填充，例如聊天、私聊、Tab 条目；
> - 服务器类占位符必须在**服务器上下文**中才会填充，例如定时广播、Tab header/footer；
> - 定时广播没有具体玩家，因此不要在其中使用 `{player}`、`{ping}` 等玩家占位符。

## 示例

### 聊天格式

```yaml
chat-format: "{channel}{Group}{Server}{Prefix}{Player}{Suffix} §8:§r {Message}"
```

### Tab 列表

```yaml
tab-list:
  format: "{server}{prefix}{player}{Suffix}"
  header: "欢迎加入{proxy} 当前服务器: {server}"
  footer: "在线 §8{online}§r / §8{total_online}§r | 登录频道 §8{login_channel_online}§r | Ping §8{ping}"
```

### 定时广播

```yaml
global:
  message-list:
    - "欢迎来到{server}，当前全服在线 {total_online} 人"
    - "{channel} 频道活动即将开始！"
```

### 进出广播

```yaml
entry-broadcast:
  backend:
    join-message: "§a(+)§r{Prefix}{Player}{Suffix} 加入了 {channel}{Server}"
```
