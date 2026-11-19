# Config Maintenance and Upgrades

This page covers versions, backups, diffs, key supplementation and structural migrations for `config.yml`, `broadcast.yml` and `message.yml`.
These features keep an existing server's configuration usable after a plugin upgrade without manual template comparison.

## Files and versions

On first start the plugin creates:

```text
.
├─ config.yml            # Main config
├─ broadcast.yml         # Scheduled and entry broadcasts
├─ message.yml           # Player-facing messages (customisable)
├─ data.db.mv.db         # H2 player database (block list, chat toggle, ...)
└─ bak/                  # Backups created by update / migration
```

Every maintainable config file carries:

```yaml
config-version: 2.1.0
```

- It describes the file's schema version and is used to decide whether keys must be added or the structure migrated;
- You normally do **not** edit it by hand;
- Bundled messages (`system-message/*.yml`) live inside the jar and are not generated on disk.

> [!WARNING]
> Back up the whole `plugins/VeloChatX/` directory before large manual edits or upgrades.

## Diff `config diff`

Read-only, modifies no files:

```text
/velochatx config diff [config|message|broadcast|all]
```

The report is per file:

| Marker | Meaning |
|---|---|
| ADDED | Present in your file, absent from the template (usually custom content) |
| REMOVED | Present in the template, absent from your file (`config update` adds it) |
| CHANGED | Present in both with different values (usually your custom value; `update` will not overwrite it) |

> [!TIP]
> `diff` and `update` read the same on-disk file, so the REMOVED keys you see are exactly what `update` would add.

## Add missing keys `config update`

```text
/velochatx config update [config|message|broadcast|all]
```

Behaviour:

1. run any pending **structural migration** for that file first;
2. add keys that exist in the template but not in your file;
3. keep your values, comments and key order;
4. back up the original to `bak/<file>.bak` (overwrites the previous backup);
5. reload the file.

> [!IMPORTANT]
> `update` only adds keys; it does not restructure old layouts.
> Structural changes such as `server-display.display` → `server.list` require `config migration`.

If nothing is missing, it reports that no update is needed.

## Migrate old structures `config migration`

```text
/velochatx config migration [config|message|broadcast|all] [--dry-run]
```

Built-in migrations:

| File | Contents |
|---|---|
| `config.yml` | `server-display.*` → `server.*`; `channels.channel-list.*.servers` → `server.list.*.channels`; removes obsolete keys |
| `broadcast.yml` | `join-leave-broadcast` / `join-leave-proxy-broadcast` → `entry-broadcast` |

Options:

- `--dry-run`: preview which files would change and from which version to which; **no writes**;
- A dry run creates no backup; an actual migration backs up to `bak/` first;
- Migrations only write target keys that do not exist yet, so already-migrated files are left untouched.

Recommended sequence:

```text
/velochatx config migration all --dry-run
/velochatx config migration all
/velochatx config update all
/velochatx reload
```

> [!TIP]
> If missing keys are still reported after migrating, run `config update` once more.

## Reloading

| Command | Effect |
|---|---|
| `/velochatx reload` | Reload **all** configs, reschedule broadcasts / tab list, and re-run binding checks |
| `/velochatx config reload config` | Reload the main config only |
| `/velochatx config reload message` | Reload `message.yml` (and refresh bundled system messages) |
| `/velochatx config reload broadcast` | Reload `broadcast.yml` only |
| `/velochatx config reload all` | Reload every config file, but **do not** reschedule tasks |

> [!NOTE]
> Values read once when a task is registered (such as `broadcast.interval` and `tab-list.interval`) require `/velochatx reload`;
> `config reload` alone does not reschedule registered tasks.

## Startup notices

At startup the plugin self-checks configuration and prints a summary:

- **outdated version**: `config-version` is lower than the bundled one;
- **missing keys**: present in the template but not in your file;
- **pending migration**: a legacy structure with an available migration;
- **config newer than the plugin**: the file comes from a newer version; downgrading is not recommended.

Each notice names the recommended command (`config update` or `config migration <file>`).
These checks run regardless of `check-update.enable`.

## Upgrading from 2.0 to 2.1

1. **Stop the proxy** and back up the whole `plugins/VeloChatX/`;
2. Replace the jar with 2.1.x and start once so the plugin reads the old config;
3. Run `/velochatx config migration all` (preview with `--dry-run` first);
4. Run `/velochatx config update all` to add new keys;
5. Run `/velochatx reload` or restart;
6. Use `/velochatx status` to verify server bindings and channels.

Things to watch during the upgrade:

- player entry/exit broadcasts moved to `entry-broadcast` in `broadcast.yml`;
- display names and channel membership are unified under `server.list.<id>.{display,channels}`;
- custom player texts stay in `message.yml`; `system-message/*.yml` is bundled and normally needs no changes;
- the old split language files are no longer used; merge any customisations into `message.yml` (player texts).

> [!TIP]
> If a custom message stops appearing after migrating, run `/velochatx config diff message` to confirm the key still exists in the template.
