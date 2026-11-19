# Permissions and Commands

This page lists VeloChatX commands, aliases and permission nodes.

The main command has these aliases:

```text
/velochatx
/vcx
/vc
/chatx
```

> [!TIP]
> `/vcx help` requires no permission. Anyone (including the console) can run it, and it only lists subcommands **you are allowed to run**.
> Tab completion is permission-filtered too: player names are not enumerated without the matching permission.

## Player commands

These are player-facing commands. All of them must be run **in game**, except `/vcmsg`, which also works from the console.

| Command | Aliases | Description | Permission node |
|---|---|---|---|
| `/mention <player>` | `/men`, `/at` | Mention a player: they get a message, optional title and a sound | `velochatx.player.mention` |
| `/vcmsg <player> <message...>` | `/vctell` | Send a cross-server private message | `velochatx.player.vcmsg` |
| `/vcx on` | - | Enable your cross-server chat send/receive | `velochatx.player.on` |
| `/vcx off` | - | Disable your cross-server chat send/receive | `velochatx.player.off` |
| `/vcx block <player>` | - | Block a player | `velochatx.player.block` |
| `/vcx unblock <player>` | - | Unblock a player | `velochatx.player.unblock` |
| `/vcx list [block]` | - | Show your block list | `velochatx.player.list` |

### Mention `/mention <player>` {#mention-command}

- The sender sees "you mentioned X"; the target sees "X mentioned you";
- With `mention-show-title` enabled, the target also gets an on-screen title;
- A sound is played;
- If the target blocked you, you still see "sent" but they receive nothing (silent block).

### Private message `/vcmsg <player> <message...>` {#message-command}

- Only the sender and receiver see it;
- The console can use it: the console is the sender and uses the `server.proxy` display name;
- The message tail is joined as one string, so spaces are fine;
- Blocking applies:
  - target blocked you: you see "sent", they receive nothing;
  - you blocked the target: the message is silently dropped.

### Chat toggle `/vcx on|off`

- When off, you no longer receive other servers' chat and your messages are not forwarded;
- The state is stored in the plugin database and survives reconnects;
- Private messages, mentions and scheduled broadcasts are unaffected.

### Blocking `/vcx block|unblock <player>` and `/vcx list`

After `/vcx block <player>`:

- You no longer receive that player's cross-server chat, mentions or private messages;
- They are not told they were blocked (silent);
- Private messages you send to them are silently dropped;
- The block list is stored in the database and persists across restarts.

`/vcx list` is the same as `/vcx list block` and shows blocked players; an empty list prints a notice.

## Administrator commands

### Available to players and console

| Command | Description | Permission node |
|---|---|---|
| `/vcx status` | Show server bindings, channels, broadcast counts and binding issues | `velochatx.admin.status` |
| `/vcx show-channel-info` | List channels and their online player counts | `velochatx.admin.show-channel-info` |
| `/vcx reload` | Reload all configs, reschedule tasks and re-check bindings | `velochatx.admin.reload` |
| `/vcx config reload [config\|message\|broadcast\|all]` | Reload one config file | `velochatx.admin.config` |
| `/vcx config diff [config\|message\|broadcast\|all]` | Read-only diff against the bundled template | `velochatx.admin.config` |
| `/vcx config update [config\|message\|broadcast\|all]` | Add missing keys (keeps values/comments, backs up first) | `velochatx.admin.config` |
| `/vcx config migration [config\|message\|broadcast\|all] [--dry-run]` | Migrate legacy structures | `velochatx.admin.config` |

See [Config Maintenance and Upgrades](/en/guide/config/maintenance) for details.

### In-game only

| Command | Description | Permission node |
|---|---|---|
| `/vcx placeholder <text>` | Resolve placeholders in the whole text | `velochatx.admin.placeholder` |

`placeholder` treats **the rest of the line** as the template, not a single argument:

```text
/vcx placeholder Hi {player}, you are on {server} in {channel}
```

> [!NOTE]
> `placeholder` needs a player context to resolve player placeholders, so it is in-game only.
> "Registered/unregistered" in `/vcx status` compares declared servers with Velocity's registrations; it is not process liveness.

## Permission model

The tree is rooted at `velochatx` with two groups:

```text
velochatx
├─ player        # Player group
│  ├─ mention
│  ├─ vcmsg
│  ├─ on / off
│  ├─ block / unblock
│  └─ list
└─ admin         # Admin group
   ├─ status
   ├─ show-channel-info
   ├─ placeholder
   ├─ reload
   └─ config
```

Every subcommand uses **any-of** matching:

| Command type | Any one of these is enough |
|---|---|
| Player command | `velochatx.player.<command>`, `velochatx.player`, `velochatx.admin` |
| Admin command | `velochatx.admin.<command>`, `velochatx.admin` |
| `help` | No permission |

So:

- `velochatx.player` grants all player commands;
- Fine-grained grants such as `velochatx.player.mention` are supported;
- `velochatx.admin` grants all admin **and** player commands.

> [!IMPORTANT]
> Velocity has no operator concept. Grant permissions through a proxy permission plugin (LuckPerms for Velocity is recommended).

LuckPerms examples:

```text
# Grant player commands to the default group
/lpv group default permission set velochatx.player true

# Grant all admin commands to the admin group
/lpv group admin permission set velochatx.admin true

# Let one player check status only
/lpv user Steve permission set velochatx.admin.status true
```

## Troubleshooting

**"Unknown command"?**
Use `/velochatx`, `/vcx`, `/vc` or `/chatx` followed by a valid subcommand.

**"You do not have permission"?**
The subcommand exists but your source lacks the node. Check `velochatx.player` / `velochatx.admin` in LuckPerms.

**Console says a command is in-game only?**
`on/off/block/unblock/list/placeholder/mention` need a player; `vcmsg`, `status`, `show-channel-info`, `config` and `reload` work from the console.
