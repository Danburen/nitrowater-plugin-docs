# What is VeloChatX

VeloChatX is a feature-rich cross-server chat plugin for the Minecraft **Velocity** proxy. It connects chat, mentions, private messages and broadcasts across backend servers.

> Want to get started? See [Quick Start](/en/guide/intro/get-start).

## Design

- **Stable**: missing config keys fall back to defaults instead of preventing startup;
- **Lightweight**: built on a small in-house WaterAPI plus the Velocity API, LuckPerms API and H2;
- **Diagnosable**: startup self-checks for server bindings, channel membership and config versions, with `/vcx status` for details;
- **Maintainable**: built-in config diff, missing-key supplementation and structural migrations, so upgrades do not require manual template comparison.

## Features

### Cross-server chat

Messages sent on a backend are forwarded to players on **other** servers using the configured format.

::: warning
VeloChatX only forwards messages across servers. Chat within a single backend, and backend-side chat moderation, are not handled by this plugin.
:::

### Channels (partitioned chat)

Assign servers to channels:

- servers in the same channel can talk to each other;
- servers outside the channel are isolated;
- `channels.global` decides whether the whole proxy is one big channel.

A server may belong to several channels. See [Cross-Server Chat and Channels](/en/guide/config/cross-server-chat).

### Private messages and mentions

- `/vcmsg`: one-to-one cross-server private messages (console can send too);
- `/mention`: notify a player, with an optional on-screen title and sound.

### Player blocking

`/vcx block` hides another player's chat, mentions and private messages. The list is stored in the database and survives restarts.

### Banned word filtering

Messages are checked before forwarding; matches are not forwarded and can be logged to the console.

### Scheduled broadcasts

Periodic announcements with:

- merged global and per-channel message pools;
- per-channel/server messages and prefixes;
- random selection so the same line does not repeat forever.

### Player entry/exit broadcasts

Messages when players join/leave the proxy, enter/leave a backend, or switch channels, with:

- hierarchical control (channel switch takes priority over backend join/leave);
- configurable delivery scope (server / channel / proxy);
- an optional first-join welcome message.

### Tab list

Takes over the player list, prefixes each name with its server, and unifies header/footer:

- dynamic refresh frequency (slower as the online count grows);
- entries and counts refresh immediately on join/leave.

### Server status placeholders

Placeholders for servers, channels, online counts and player ping. See [Placeholder Reference](/en/reference/placeholder).

### Config maintenance

- `/vcx config diff`: compare with the bundled template;
- `/vcx config update`: add new keys;
- `/vcx config migration`: migrate legacy structures;
- `/vcx reload`: reload and reschedule tasks.

See [Config Maintenance and Upgrades](/en/guide/config/maintenance).
