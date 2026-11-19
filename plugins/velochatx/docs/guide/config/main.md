# 主配置

以下配置均在 `config.yml` 中找到并修改。

> [!IMPORTANT]
> 所有配置文件都是 `yaml` 格式，对缩进和符号比较敏感，请严格保持原有层级。

> [!TIP]
> 修改后可以用 `/vcx config reload config` 只重载主配置，或 `/vcx reload` 重载全部配置并重排定时任务。
> 少数项（例如数据库、语言资源）仍建议重启生效。

## 基础开关

```yaml
# 配置文件版本，检测更新/迁移时使用，通常不需要改动
config-version: 2.1.0

# 插件总开关：false 时插件整体不初始化（聊天、广播、命令全部不可用）
enable: true
# 调试日志：排查问题时临时开启，平时保持 false
debug: false
# 跨服聊天转发开关：false 时不再把聊天转发到其他服务器
crossing-chat-enable: true
```

- `config-version`：配置文件的结构版本，由插件读取。升级插件后如果发现缺失键或结构变化，启动时会提示使用 `config update` / `config migration`，详见[配置维护与升级](/guide/config/maintenance)。
- `enable`：控制**整个插件**是否启用。它不会阻止插件被 Velocity 加载，但插件不会注册命令、不会处理聊天和广播。
- `debug`：输出更详细的调试日志，用于排查配置或绑定问题。
- `crossing-chat-enable`：只控制**跨服聊天的转发**。关闭后：
  - 玩家消息不会再发送到其他服务器；
  - 若 `log-text.enable` 为 `true`，终端仍会记录本服聊天；
  - 提及、私聊、定时广播、进出广播不受影响。

> [!NOTE]
> VeloChatX 只负责**跨服转发**。玩家在自己子服内看到的聊天、子服内部的违禁词处理，仍然由子服（Paper/Spigot 等）的聊天插件负责。

## 自动更新

```yaml
check-update:
  enable: true
  auto-download: true
```

- `enable`：启动时向 GitHub 检查是否有新版本。
- `auto-download`：发现新版本时自动下载到 `plugins/` 目录（与当前插件 jar 同级），文件名形如 `VeloChatX-<版本>.jar`。
  - 下载**不会**替换正在运行的 jar，也不会自动重启；确认后手动替换并重启代理服即可。
  - 设为 `false` 时只在控制台提示有新版本。

> [!TIP]
> 配置文件的“缺失键 / 版本落后 / 待迁移”提示与这个开关无关，属于插件启动自检，始终会执行。

## 聊天格式

VeloChatX 通过填充占位符来生成跨服聊天文本：

```yaml
chat-format: "{channel}{Group}{Server}{Prefix}{Player}{Suffix} §8:§r {Message}"
```

常用占位符：

| 占位符 | 说明 |
|---|---|
| `{channel}` | 玩家所在服务器所属频道的显示名 |
| `{Group}` | 玩家在 LuckPerms 中的组别 |
| `{Prefix}` / `{Suffix}` | 玩家的前缀 / 后缀 |
| `{Server}` | 玩家所在服务器的显示名（由 `server.list.<id>.display` 决定） |
| `{Player}` | 玩家名字 |
| `{Message}` | 玩家发送的消息文本 |

> [!WARNING]
> `{Server}`、`{Player}`、`{Message}` 三个占位符是**必须的**。
> 缺少任意一个时，插件会回退到默认格式 `{server} {player}: {message}`，并在控制台给出提示。

> [!TIP]
> - 占位符**不区分大小写**，`{server}` 与 `{Server}` 等价。
> - 大部分文本同时支持 `§` 与 `&` 颜色代码。
> - 完整占位符列表见[占位符参考](/reference/placeholder)。

### 聊天文本转换模型

```yaml
chat-format-model: "none"
```

控制转发到其他服务器之前的文本转换方式：

| 值 | 说明 | 适用场景 |
|---|---|---|
| `none` | 不做转换，直接发送原始文本 | 原版客户端，兼容性最好（部分 Fabric 客户端可能显示异常） |
| `legacy` | 转换为 Adventure Legacy Component | 推荐；兼容大多数服务端与客户端 |
| `mini-message` | 按 MiniMessage 解析 | 需要富文本效果（渐变、悬浮等）时使用 |

> [!TIP]
> 不确定选哪个时，使用 `legacy`。`mini-message` 依赖客户端/服务端对标签的解析能力，配置错误会原样显示标签文本。

## 终端聊天输出

Velocity 默认不会记录后端服务器的聊天。若希望在代理端统一看到聊天日志，可开启：

```yaml
log-text:
  enable: true
  # 是否把聊天里的 § 颜色代码转换成终端 ANSI 颜色
  convert: true
```

- `enable`：是否在控制台输出玩家的跨服聊天文本。
- `convert`：
  - `true`：控制台按 ANSI 颜色显示，日志文件本身不包含颜色代码；
  - `false`：不转换，避免少数终端出现乱码。
- 该开关也影响插件其它控制台输出的颜色解析方式，修改后建议执行一次重载。

> [!TIP]
> 在线人数很多时，终端输出会占用一定 I/O；如果不需要统一日志，可以关闭 `enable`。

## 语言与玩家消息

```yaml
# 服务端默认语言：zh / en
locale: zh

# global：所有玩家使用服务端语言的消息（message.yml 可自定义）
# locale：按玩家客户端语言显示内置消息（不可自定义）
player-locale: global
```

- `locale`：插件消息、命令提示、广播等默认使用的语言。未填写时使用 JVM 默认语言。
- `player-locale`：
  - `global`：按服务端 `locale` 显示，使用 `message.yml` 中的自定义文本；
  - `locale`：按玩家客户端语言显示插件内置文本，适合多语言玩家群体，但无法逐条自定义。

消息文件说明：

| 文件 | 是否生成到插件目录 | 作用 |
|---|---|---|
| `message.yml` | 是 | 提及、私聊、屏蔽、违禁词等玩家可见文本，可自由修改 |
| `config.yml` | 是 | 主配置 |
| `broadcast.yml` | 是 | 定时广播与进出广播 |
| `system-message/*.yml` | 否（打包在 jar 内） | 命令帮助、状态输出、绑定诊断等管理员文本 |

> [!NOTE]
> `message.yml` 中的所有键都不能删除或改名，否则对应消息会缺失；值可以自由修改。

## 提及标题 {#mention-config}

```yaml
mention-show-title:
  enable: true
  time:
    fade-in: 1
    stay: 2
    fade-out: 1
```

当玩家使用 `/mention` 提及他人时，被提及的玩家屏幕中央会显示标题：

- `enable`：是否显示标题。
- `fade-in`：淡入时间。
- `stay`：完全显示时间。
- `fade-out`：淡出时间。

> [!TIP]
> 时间单位为**秒**，支持整数；非整数会自动四舍五入。
> 提及还会播放一次提示音（`minecraft:block.note_block.pling`）。
> 主标题与副标题的文本在 `message.yml` 的 `mention-title-show-main` / `mention-title-show-sub` 中修改。

## Tab 列表

VeloChatX 可以接管玩家的 Tab 列表，在每个玩家名字前显示所在服务器，并统一 header/footer：

```yaml
tab-list:
  enable: true
  # 动态刷新比例，范围 [0, 1]；0 表示固定频率
  refresh-ratio: 0.5
  # 基础刷新间隔，毫秒；0 表示不进行周期刷新
  interval: 1000
  format: "{server}{prefix}{player}{Suffix}"
  header: "欢迎加入{proxy} 当前服务器: {server}"
  footer: "在线人数 §8{online}§r / §8{total_online}§r | Ping: §8{ping}"
```

- `enable`：是否启用 Tab 列表接管。关闭后完全不影响原版/其他插件的 Tab 显示。
- `interval`：
  - `> 0`：按间隔刷新；
  - `0`：改为**事件驱动**，在玩家进出、切换子服时立即刷新，不再周期刷新。插件仍会每 5 分钟做一次兜底全量刷新。
- `refresh-ratio`：动态刷新比例，限定在 `[0, 1]`：
  - `0`：始终使用固定的 `interval`；
  - `> 0`：实际刷新间隔按在线人数放大：

    ```text
    实际间隔 = interval × (1 + 在线人数 / 20 × refresh-ratio)
    ```

    在线人数越多，刷新越慢，以降低性能开销。
- `format`：每个玩家条目的格式，支持玩家与服务器占位符。
- `header` / `footer`：Tab 顶部/底部文本，只支持服务器类占位符。
  - **两项都必须填写**；任意一项为空时，header/footer 不会更新。

> [!TIP]
> 在线人数较多时建议调大 `interval`，或把 `refresh-ratio` 调大以进一步降频。
> 玩家进出服务器时，条目与 header/footer 会立即刷新，不必等待下一个周期。

## 违禁词屏蔽

```yaml
ban-words:
  enable: true
  log-to-console: true
  words: "操,干,日,狗,垃圾,傻逼"
```

- `enable`：是否启用违禁词检查。
- `log-to-console`：命中时是否在终端记录该玩家与消息内容，便于管理员处理。
- `words`：以英文逗号 `,` 分隔的违禁词列表。
  - 匹配为**不区分大小写的包含匹配**，例如 `spam` 会命中 `SPAM`、`spammer`；
  - 若消息中包含任意一个词，该消息**不会转发到其他服务器**，发送者会收到提示；
  - 发送者所在子服内的聊天不受影响。

> [!WARNING]
> 违禁词只处理跨服转发这一层。子服内部的聊天过滤请使用子服的聊天管理插件。
