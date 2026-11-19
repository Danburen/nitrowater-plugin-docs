# Player Entry/Exit Broadcasts

The following options live in `broadcast.yml`.

This page covers broadcasts triggered by player actions: joining/leaving the proxy, entering/leaving a backend server, switching channels, and the welcome message on first join.
For interval-based broadcasts see [Scheduled Broadcasts](/en/guide/config/active-broadcast).

## Hierarchical entry broadcast `entry-broadcast`

Since 2.1 all player entry/exit messages are managed by `entry-broadcast`:

```yaml
entry-broadcast:
  # Print these messages to the console
  log-to-console: true
  # true: only the highest-priority message is sent for one movement
  # false: send every applicable level
  hierarchical-overlay: true

  # Backend server join/leave
  backend:
    enable: true
    scope: server
    join-message: "§a(+)§r{Group}{Prefix}{Player}{Suffix} joined {channel}{Server}"
    leave-message: "§c(-)§r{Group}{Prefix}{Player}{Suffix} left {channel}{Server}"

  # Channel switch
  channel:
    enable: true
    scope: channel
    join-message: "§7(+)§r{Group}{Prefix}{Player}{Suffix} joined {channel}"
    leave-message: "§7(-)§r{Group}{Prefix}{Player}{Suffix} left {channel}"

  # Proxy join/leave
  proxy:
    enable: true
    scope: proxy
    join-message: "§7[+]§r{Group}{Prefix}{Player}{Suffix} joined {Proxy}"
    leave-message: "§7[-]§r{Group}{Prefix}{Player}{Suffix} left {Proxy}"
```

### When each block fires

| Block | Trigger | Delivery |
|---|---|---|
| `proxy` | Player logs in / disconnects from the proxy | Always to the whole proxy |
| `channel` | Player moves from channel A to channel B | Controlled by `scope` |
| `backend` | Player enters / leaves a backend server | Controlled by `scope` |

One movement can satisfy several levels. For example, moving from a login server to a survival server also switches channels:

- `hierarchical-overlay: true`: only the higher-priority **channel** message is sent; the backend message is suppressed;
- `hierarchical-overlay: false`: both channel and backend messages are sent.

Priority is **channel switch > backend join/leave**. `proxy` login/disconnect is independent and unaffected by `hierarchical-overlay`.

> [!NOTE]
> On a player's first connection, both the `proxy` join message and one `backend` join message usually fire.
> Disable one block, or keep only the level you want with `hierarchical-overlay: true`.

### `scope`: who receives it

For `backend` and `channel`:

| Value | Delivery |
|---|---|
| `server` | Only the target backend (the new server on join / the old server on leave) |
| `channel` | All servers in the target server's channel |
| `proxy` | All players on the proxy |

`proxy` entry/exit messages are always proxy-wide; its `scope: proxy` only keeps the structure uniform.

### Message templates

`join-message` / `leave-message` support the same placeholders as chat formats:

- `{Player}`, `{Prefix}`, `{Suffix}`, `{Group}`: resolved from the player;
- `{Server}`, `{channel}`: resolved from the **message's server** (the new server on join, the old one on leave);
- `{Proxy}`: proxy display name.

> [!WARNING]
> Do not split the prefix into the old `join-prefix` / `player-join-message` pair.
> 2.1 merged them into one template; `config migration` converts the legacy keys automatically.

## Welcome message `welcome-broadcast`

```yaml
welcome-broadcast:
  enable: true
  # Only send on the player's first join
  only-first-join: false
  message: "Welcome to §5our network§r!"
```

- `enable`: whether to send the welcome message.
- `only-first-join`:
  - `false`: every login;
  - `true`: only when the player first appears in the database.
- `message`: text, player and server placeholders supported.

> [!NOTE]
> Despite the name, this message is sent **only to the joining player**, not to the whole server.
> "First join" is tracked in the plugin database; deleting it makes everyone a first-time player again.

## Upgrading from 2.0

`join-leave-broadcast` and `join-leave-proxy-broadcast` were merged into `entry-broadcast` in 2.1. Run:

```text
/velochatx config migration broadcast
```

The migration:

- merges the old server join/leave switches, prefixes and messages into `entry-broadcast.backend`;
- derives `scope` from `broadcast-in-channel` / `send-to-all-subServer`;
- moves `join-leave-proxy-broadcast` to `entry-broadcast.proxy`;
- removes the legacy sections.

> [!TIP]
> Preview first with `/velochatx config migration broadcast --dry-run`.
