# Cargo Role Manager Bot

A lightweight Discord bot for **tier-based role management** with built-in **moderation commands** (`ban`, `kick`, `mute`).

All configuration is done **inside Discord** — no file editing required.

---

## Overview

Cargo Role Manager uses a **custom tier system** with priorities to control staff permissions.

With tiers, you can:

- Assign staff roles to permission tiers
- Control which roles each tier can add or remove
- Define tier priority (higher tiers inherit lower-tier permissions)
- Control access to moderation commands independently of Discord permissions
- Keep chat clean with auto-deleted commands and responses

**Discord Administrators always have full access.**

---

## 1. Required Bot Permissions

Make sure the bot’s role has:

- **Manage Roles**
- **Manage Messages**
- **Ban Members**
- **Kick Members**
- **Moderate Members** (Timeout Members)

Also ensure:

- The bot role is **above any roles it needs to assign**
- The bot role is **above users it needs to moderate**

If the bot is lower in the role list, Discord will block the action.

---

## 2. Setup Commands (Admin Only)

Only users with the **Administrator** permission can configure the bot.

---

### Tier-Based Setup Commands

Create and manage permission tiers:

    !setup createtier <name> <priority>
    !setup settierpriority <name> <priority>
    !setup deletetier <name>

Assign staff roles to tiers:

    !setup tierrole <tier> @Role
    !setup remtierrole <tier> @Role

Allow tiers to manage roles:

    !setup allow <tier> @Role
    !setup remallow <tier> @Role

Other setup commands:

    !setup logs #channel
    !setup logs off
    !setup reset
    !setup show

---

### Tier Priority Rules

- Higher priority numbers = more power
- Higher tiers **inherit permissions** from lower tiers
- If a user belongs to multiple tiers, **only the highest priority tier is used**

---

## Moderation Access Tier

Control who can use moderation commands:

    !setup modtier default
    !setup modtier <tier>

- `default` → moderation requires the **lowest priority tier** (or higher)
- Setting a tier → only that tier (and higher) can use moderation commands

Moderation access is **tier-based**, not based on Discord’s Ban/Kick/Timeout permissions.

---

## 3. Role Management Commands

Add a role:

    !addcargo @Role @User

Remove a role:

    !remcargo @Role @User

Rules:

- Only configured staff tiers can use these commands
- Roles must be explicitly allowed for the user’s tier
- Commands and responses auto-delete after a few seconds

---

## 4. Moderation Commands

    !ban @User <reason>
    !kick @User <reason>
    !mute @User <duration> <reason>

### Notes

- **Reason is required** for all moderation commands
- `!mute` duration formats:
  - `30m`
  - `2h`
  - `1d`
  - `1w`
  (Maximum: 28 days)
- The bot **DMs the target user** before taking action
- Access is controlled via **tiers**, not Discord permissions

---

## 5. Info Command

Post a portfolio-friendly summary embed:

    !info

This sends a persistent embed describing what the bot does and listing key commands.

---

## 6. Important: Role & User Hierarchy

If a role or moderation action fails:

1. Go to **Server Settings → Roles**
2. Move the bot role **above**:
   - Roles it needs to assign
   - Users it needs to moderate

Discord does not allow bots to manage roles or users above themselves.

---

## 7. Troubleshooting

**Bot not responding**
- Confirm the bot is online
- Check command spelling

**Command deletes instantly**
- User is not in an allowed staff tier

**Role command fails**
- Role is not allowed for the user’s tier
- Bot role is too low in hierarchy

**Ban / Kick / Mute fails**
- Missing bot permission
- Target user is above the bot in the role list

---

## What This Bot Does Well

- Clean chat (auto-deletes commands and responses)
- Flexible tier-based permission system
- Priority-based access control
- Moderation access independent of Discord permissions
- Per-server configuration
- Prevents restricted role abuse

---

Once configured, **Cargo Role Manager** enforces your server’s role and moderation rules automatically.
