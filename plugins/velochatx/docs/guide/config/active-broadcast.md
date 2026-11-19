# 定时广播配置

以下配置均在 `broadcast.yml` 中找到并修改。

本页介绍由插件内置计时器触发的**定时广播**，用于周期性地向玩家发送新手帮助、活动提示等信息。
玩家进出触发的广播请看[玩家进出广播配置](/guide/config/passive-broadcast)。

## 工作方式

VeloChatX 的定时广播由「全局广播」和「分区广播」两部分合并而成：

1. 每个广播周期，插件按服务器逐个处理；
2. 取出该服务器可用的消息：全局消息 + 该服务器所属分区的消息；
3. 合并去重后，**随机抽取一条**，加上该服务器最终生效的前缀；
4. 只向该服务器发送一次（不会按玩家数量重复发送）。

```yaml
# 广播间隔，单位：秒
interval: 120
```

- `interval` 必须大于 `0`。填写 `0` 或负数会**关闭定时广播**，并在控制台给出警告。
- `random` 为保留键；当前版本每个周期都会从合并后的消息池中随机抽取一条。
- 玩家规模较大时，建议把间隔调长，避免不必要的开销。

> [!TIP]
> 广播消息里的玩家占位符（如 `{Player}`）不会生效，因为广播是面向服务器的，没有具体玩家上下文；
> 请使用服务器类占位符（`{server}`、`{channel}`、`{proxy}`、`{online}` 等）。

## 全局广播

```yaml
global:
  enable: true
  prefix: "§7[§b服务器娘§7]§r §8:§r"
  message-list:
    - "欢迎进入{proxy}，快来和大家一起冒险吧！"
    - "本服§r每日§a活跃§r玩家有机会获得丰厚奖励！"
    - "§c注意：§r请遵守服务器规则，共同创建和谐的游戏环境。"
    - "§a欢迎大家来到§7{server}§r，祝您游戏愉快！"
```

- `enable`：是否启用全局广播。
- `prefix`：全局广播的前缀。
- `message-list`：消息池。启用全局广播后，这些消息会与分区广播的消息**合并**（全局消息排在前面）。

## 分区广播

```yaml
locale:
  enable: true
  broadcast-list:
    # 每个条目是一组分区广播
    example:
      enable: true
      prefix: "[§a服务器娘§r] §8:§r"
      message-list:
        - "服务器正在§a搭建§r中，更多精彩内容即将呈现。"
        - "§6欢迎§r加入服务器官方群"
      # 按频道匹配
      channel-list:
        - login
      # 按服务器 ID 匹配（可留空）
      server-list:
        - lobby
    example2:
      enable: false
      prefix: "[§a服务器娘§r] §8:§r"
      message-list:
        - "§b新手村§r已开启，来吧！新玩家，开始您的冒险吧！"
      channel-list:
        - lobby
        - games
      server-list: []
```

- `enable`：是否启用分区广播。
- `broadcast-list`：每组分区广播的集合，键名（`example`、`example2`）只是标识。
- `channel-list`：该组广播覆盖的频道，频道内的所有服务器都会收到。
- `server-list`：该组广播额外覆盖的服务器 ID（与 `velocity.toml` / `server.list` 一致），可留空。
- `prefix`：该组广播的前缀。

### 合并与优先级

- 只有在 `global.enable` 与 `locale.enable` 都为 `true` 时，两者才会合并。
- 分区广播的 `prefix` **优先于**全局前缀：某个服务器同时命中分区广播时，使用分区的前缀。
- 多个分区广播命中同一服务器时：
  - `prefix` 以**最后一个**命中的分区广播为准；
  - 消息会合并，重复消息只保留一份，不会因此提高出现概率。
- 键名相同的分区广播只会读取第一个。

> [!NOTE]
> 当 `server-list` 与 `channel-list` 命中同一服务器时，不会重复发送，消息会去重后进入同一个消息池。

## 从旧版升级

`broadcast.yml` 的 `config-version` 同样是 `2.1.0`。如果从 2.0 升级，建议依次执行：

```text
/velochatx config migration broadcast
/velochatx config update broadcast
/velochatx reload
```

这样可以同时完成结构迁移、补齐新增键并让新的广播间隔立即生效。
