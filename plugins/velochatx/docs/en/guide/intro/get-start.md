# Quick Start

## Installation

### Prerequisites

| Requirement | Version |
|---|---|
| [Velocity](https://docs.papermc.io/velocity/) | 3.3.0+ recommended |
| Java | 17+ |
| [LuckPerms for Velocity](https://luckperms.net/download) | 5.4+ recommended, for prefix/suffix/group and permissions |
| [VeloChatX](https://github.com/Danburen/VeloChatX/releases) | 2.1.0+ recommended |

> [!NOTE]
> LuckPerms is not required to start the plugin, but without it `{prefix}`, `{suffix}` and `{group}` cannot resolve, and you cannot grant permissions.

### Steps

1. Put `VeloChatX-x.x.x.jar` into Velocity's `plugins/` directory;
2. Start the proxy and wait for the enable message;
3. Stop the server and edit the files under `plugins/VeloChatX/`;
4. Start again and run `/vcx status` to verify server bindings and channels.

## Generated files

After the first 2.1 start:

```text
plugins/VeloChatX/
├─ config.yml          # Main config (chat, channels, tab list, banned words, update check)
├─ broadcast.yml       # Scheduled + entry broadcasts
├─ message.yml         # Player-facing messages (customisable)
├─ data.db.mv.db       # H2 player database (block list, chat toggle, ...)
└─ bak/                # Backups from config update / migration
```

- `config.yml`: most features; see [Main Configuration](/en/guide/config/main) and [Cross-Server Chat and Channels](/en/guide/config/cross-server-chat).
- `broadcast.yml`: see [Scheduled Broadcasts](/en/guide/config/active-broadcast) and [Player Entry/Exit Broadcasts](/en/guide/config/passive-broadcast).
- `message.yml`: player-facing texts for mentions, private messages, blocking and banned words. **Never remove or rename keys**; values are editable.
- `data.db.mv.db`: player data and block relationships. Deleting it loses every player's block list and chat toggle state.
- `bak/`: appears after an update/migration and holds the most recent backup of the replaced file.
- `system-message/*.yml`: admin texts (command help, status, binding diagnostics) bundled inside the jar; not created on disk.

> [!WARNING]
> If the layout differs, you may still be on 2.0 or older; upgrading to 2.1+ is recommended.

## First-time checklist

1. **Align server IDs**: `velocity.toml` `[servers]`, `config.yml` `server.list`, and `channels.channel-list` (case-sensitive).
2. **Set display names and channels**: see [Cross-Server Chat and Channels](/en/guide/config/cross-server-chat).
3. **Choose global mode**: `channels.global: true` lets every server talk to every server; `false` restricts to shared channels.
4. **Configure broadcasts**: scheduled broadcasts are enabled by default; adjust interval and messages in `broadcast.yml`.
5. **Verify**: run `/vcx status`; there should be no `PHANTOM` servers and channel membership should match expectations.

## Running

Common maintenance commands:

```text
/vcx help                  # Commands you are allowed to use
/vcx status                # Bindings, channels and broadcast statistics
/vcx show-channel-info     # Channels and online counts
/vcx reload                # Reload all configs and reschedule tasks
```

See [Permissions and Commands](/en/reference/cmdsAndPerms) for the full list, and [Config Maintenance and Upgrades](/en/guide/config/maintenance) for updates and migrations.
