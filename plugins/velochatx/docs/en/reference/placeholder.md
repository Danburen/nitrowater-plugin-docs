# Placeholder Reference

VeloChatX ships a set of built-in placeholders for chat formats, tab lists, broadcasts and messages.
They can be used in `config.yml`, `broadcast.yml` and `message.yml`.

## Syntax

- Wrap the name in braces: `{player}`;
- `%name%` is also accepted: `%player%` equals `{player}`;
- Names are **case-insensitive**: `{Server}` equals `{server}`;
- Only placeholders that the current context can resolve are replaced.

> [!TIP]
> In game, `/vcx placeholder <text>` previews the resolution of a whole line (requires `velochatx.admin.placeholder`, in-game only).

## Server placeholders

For contexts with a server: broadcasts, tab list header/footer, server messages.

| Placeholder | Description |
|---|---|
| `{server}` | Display name from `server.list.<id>.display` |
| `{channel}` | Display name of the server's channel; empty when none |
| `{proxy}` | Proxy display name from `server.proxy` |
| `{online}` | Online count of the current server; `0` when unknown |
| `{total_online}` | Online count across the whole proxy |

## Player placeholders

For contexts with a player: chat, private messages, mentions, tab list entries.

| Placeholder | Description |
|---|---|
| `{player}` | Player name |
| `{prefix}` | Player prefix (LuckPerms) |
| `{suffix}` | Player suffix (LuckPerms) |
| `{group}` | Player group (LuckPerms) |
| `{ping}` | Player latency in milliseconds |

> [!NOTE]
> `{prefix}` / `{suffix}` convert LuckPerms `&` colour codes to `§`, so colours render in chat, tab list and broadcasts.

## Dynamic counts

| Placeholder | Description |
|---|---|
| `{<channel>_channel_online}` | Online count of a specific channel |

For a channel named `login`:

```text
Login channel online: {login_channel_online}
```

The channel name must match a key under `channels.channel-list`; a missing channel shows `0`.

## Context limits

> [!IMPORTANT]
> - Player placeholders only resolve in a **player context** (chat, private message, tab entry);
> - Server placeholders only resolve in a **server context** (scheduled broadcast, tab header/footer);
> - Scheduled broadcasts have no player, so do not use `{player}`, `{ping}` there.

## Examples

### Chat format

```yaml
chat-format: "{channel}{Group}{Server}{Prefix}{Player}{Suffix} §8:§r {Message}"
```

### Tab list

```yaml
tab-list:
  format: "{server}{prefix}{player}{Suffix}"
  header: "Welcome to {proxy} | Current server: {server}"
  footer: "Online §8{online}§r / §8{total_online}§r | Login channel §8{login_channel_online}§r | Ping §8{ping}"
```

### Scheduled broadcast

```yaml
global:
  message-list:
    - "Welcome to {server}, {total_online} players online"
    - "{channel} event starting soon!"
```

### Entry broadcast

```yaml
entry-broadcast:
  backend:
    join-message: "§a(+)§r{Prefix}{Player}{Suffix} joined {channel}{Server}"
```
