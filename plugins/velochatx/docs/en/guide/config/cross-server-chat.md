# Cross-Server Chat and Channels

This page explains how to connect Velocity backends to VeloChatX and how to group players with channels.

Two sections in `config.yml` are involved:

| Section | Purpose |
|---|---|
| `server` | Each backend's **display name** and **channels** (server-centric) |
| `channels` | Channel **metadata**: display name, welcome message, and global mode (channel-centric) |

## Three IDs must match

Before configuring, make sure these three places use exactly the same server IDs (**case-sensitive**):

1. Keys under `[servers]` in `velocity.toml`;
2. Keys under `server.list` in `config.yml`;
3. Channel names under `channels.channel-list` (channels and server IDs are different namespaces).

```toml
# velocity.toml
[servers]
lobby = "127.0.0.1:25565"
server1 = "127.0.0.1:25566"
server2 = "127.0.0.1:25567"
```

## Server display names and bindings

The recommended form keeps display names and channel membership in one place:

```yaml
server:
  # Enable display names
  display-enable: true
  # Proxy display name, used by {proxy}
  proxy: "[§5Proxy§r]"
  list:
    lobby:
      display: "[§dLobby§r]"
      channels:
        - login
    server1:
      display: "[§3MiniGames§r]"
      channels:
        - games
    server2:
      display: "[§2Survival§r]"
      channels:
        - survive
```

- `display-enable`:
  - `true`: display names are active. A backend not declared in `server.list` renders `{server}` as `[raw-id]`;
  - `false`: `{server}` renders the raw ID.
- `proxy`: output of `{proxy}`; also used as the sender name when the console sends a private message.
- `list.<id>.display`: display name. Colour codes and brackets are allowed; the plugin does not wrap it again.
- `list.<id>.channels`: channels this server belongs to (one or more). Channel display names and welcome texts live under `channels`.

> [!WARNING]
> Channel names in `list.<id>.channels` must exist under `channels.channel-list`; unknown names are ignored and `{channel}` stays empty.

> [!WARNING]
> Keys under `server.list` must match `[servers]` in `velocity.toml` exactly.
> A wrong case produces a `PHANTOM` server that can never match a real backend.

### Undeclared servers

- `display-enable: true`: `{server}` renders `[raw-id]`;
- `display-enable: false`: `{server}` renders the raw ID;
- `{channel}` is empty (the server belongs to no channel);
- Startup prints binding notices; use `/vcx status` for details.

## Channels and isolation

A channel only defines how it is displayed and what players see on entry; membership lives in `server.list`:

```yaml
channels:
  # true: every server can talk to every server; channels only affect display
  # false: only servers in a shared channel can talk to each other
  global: true

  channel-list:
    login:
      display: "[§6Login§r]"
      welcome:
        enable: true
        message: "Welcome to the login channel"
    games:
      display: "[§6MiniGames§r]"
      welcome:
        enable: true
        message: "Welcome to the mini-games channel"
    survive:
      display: "[§6Survival§r]"
      welcome:
        enable: true
        message: "Welcome to the survival channel"
```

- `global: true`: cross-server chat is forwarded between all servers; channels only affect `{channel}` and welcome messages.
- `global: false`: messages are forwarded only between servers that share at least one channel.
  - Servers in no channel cannot communicate; startup prints a warning.
  - Private messages and mentions are never restricted by channels.
- `display`: channel display name used by `{channel}` and `/vcx show-channel-info`.
- `welcome`: a message sent **to the player** when they enter a server in this channel:
  - `enable`: whether to send it;
  - `message`: text, placeholders supported.

> [!NOTE]
> A server can belong to several channels. In that case `{channel}` shows the **first matching channel** in configuration order.
> Two servers can communicate when they share any channel.

## Legacy configuration and migration

Before 2.1 the layout was channel-centric:

```yaml
server-display:
  enable: true
  proxy: "[§5Proxy§r]"
  display:
    lobby: "[§dLobby§r]"

channels:
  channel-list:
    login:
      servers:
        - lobby
```

2.1 still reads the legacy keys for a smooth upgrade:

- `server-display.display.<id>` takes precedence **per id** over `server.list.<id>.display`;
- `server-display.proxy` over `server.proxy`;
- `server-display.enable` over `server.display-enable`;
- If **any** `channels.channel-list.<name>.servers` is a non-empty list, the whole file is treated as legacy:
  - `server.list.*.channels` is **ignored as a whole**;
  - membership comes from `channel-list.*.servers`;
  - per-server `display` still applies.

> [!TIP]
> Mixing old and new forms is the usual reason "the new key does nothing".
> Once you are ready, run `/velochatx config migration config` to move legacy keys to the new structure and remove them.

## Startup checks and `/vcx status`

At startup the plugin checks bindings, channel membership and Velocity registrations, and prints problems. Admins can run:

```text
/velochatx status
```

It reports:

- declared servers vs. Velocity-registered / unregistered;
- channel count;
- broadcast message count (global / per-channel);
- binding state per server:

| State | Meaning | Action |
|---|---|---|
| `BOUND` | Declared and registered in Velocity | OK |
| `UNBOUND` | Registered in Velocity but not declared | Add it to `server.list`, or ignore (raw ID) |
| `PHANTOM` | Declared but not registered in Velocity | Check the ID and its case |

Common notices:

- **channel references an unknown server**: that member is dropped and `{channel}` may be empty;
- **channel has no valid servers**: the channel is empty;
- **server belongs to no channel**: with `global: false` it cannot use cross-server chat;
- **legacy binding detected**: run the config migration.

> [!TIP]
> `/vcx show-channel-info` lists channels with their online player counts; the count is the total across all servers in that channel.
