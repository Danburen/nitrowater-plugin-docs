# Scheduled Broadcasts

The following options live in `broadcast.yml`.

This page covers interval-based broadcasts driven by the plugin's timer, used for beginner tips, event notices and similar recurring messages.
For player-triggered messages see [Player Entry/Exit Broadcasts](/en/guide/config/passive-broadcast).

## How it works

Each cycle, for every server:

1. collect the messages available to that server: global messages + messages from the channels it belongs to;
2. merge and de-duplicate them;
3. randomly pick one message and prepend the effective prefix;
4. send it once **per server** (not once per player).

```yaml
# Broadcast interval in seconds
interval: 120
```

- `interval` must be greater than `0`. Setting `0` or a negative value **disables scheduled broadcasts** and logs a warning.
- `random` is reserved; the current version always picks one message at random from the merged pool each cycle.
- With a large player base, increase the interval to reduce overhead.

> [!TIP]
> Player placeholders such as `{Player}` do not work in scheduled broadcasts because there is no player context.
> Use server placeholders (`{server}`, `{channel}`, `{proxy}`, `{online}`, ...).

## Global broadcast

```yaml
global:
  enable: true
  prefix: "§7[§bServerBot§7]§r §8:§r"
  message-list:
    - "Welcome to {proxy}! Join our adventure!"
    - "Daily §aactive§r players may receive rewards!"
    - "§cNotice:§r Please follow the server rules."
    - "§aWelcome to §7{server}§r, enjoy your stay!"
```

- `enable`: whether global broadcasts are active.
- `prefix`: prefix for global messages.
- `message-list`: the message pool. When enabled, it is **merged** with per-channel messages (global messages first).

## Per-channel broadcast

```yaml
locale:
  enable: true
  broadcast-list:
    example:
      enable: true
      prefix: "[§aServerBot§r] §8:§r"
      message-list:
        - "Server is §aunder construction§r, more content coming!"
        - "§6Welcome§r to our official group"
      # Match by channel
      channel-list:
        - login
      # Match by server id (may be empty)
      server-list:
        - lobby
    example2:
      enable: false
      prefix: "[§aServerBot§r] §8:§r"
      message-list:
        - "§bStarter zone§r is open! Begin your adventure!"
      channel-list:
        - lobby
        - games
      server-list: []
```

- `enable`: whether per-channel broadcasts are active.
- `broadcast-list`: a set of broadcast groups; the keys (`example`, `example2`) are just identifiers.
- `channel-list`: channels covered by this group — every server in those channels receives it.
- `server-list`: extra server IDs covered by this group (must match `velocity.toml` / `server.list`); may be empty.
- `prefix`: prefix for this group.

### Merge and precedence

- Global and per-channel messages merge only when both `global.enable` and `locale.enable` are `true`.
- A per-channel `prefix` **overrides** the global prefix for servers that match it.
- When several groups match one server:
  - the **last** matching group's `prefix` wins;
  - messages merge, and duplicates are kept once, so duplication does not increase the chance of appearing.
- Groups with the same name: only the first is read.

> [!NOTE]
> A server matched by both `server-list` and `channel-list` is not sent twice; messages are de-duplicated into one pool.

## Upgrading from an older version

`broadcast.yml` also carries `config-version: 2.1.0`. When upgrading from 2.0:

```text
/velochatx config migration broadcast
/velochatx config update broadcast
/velochatx reload
```

This migrates the legacy entry/exit structure, adds new keys, and applies the new interval immediately.
