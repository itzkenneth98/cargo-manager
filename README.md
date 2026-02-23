# Cargo Role Manager Bot

A lightweight Discord bot that allows server staff to add or remove
specific roles from users using simple commands.

This guide explains **how to set up the bot inside your server** after
inviting it.

------------------------------------------------------------------------

## Overview

The bot uses a simple permission system:

-   **Moderators** -- can manage basic roles\
-   **Admins** -- can manage all roles (including admin-only roles)\
-   **Non-staff** -- commands are automatically deleted

All configuration is done **inside Discord** using setup commands.\
No file editing is required.

------------------------------------------------------------------------

## 1. Required Bot Permissions

Make sure the bot's role:

-   Has **Manage Roles**
-   Has **Manage Messages**
-   Is placed **above any roles it needs to assign**

If the bot is below a role, Discord will block it.

------------------------------------------------------------------------

## 2. Setup Commands (Server Admin Only)

Only users with the **Administrator permission** can configure the bot.

### Set Moderator Roles

Users with these roles will be treated as Moderators:

!setup modrole @Role

You can run this multiple times to add more Moderator roles.

------------------------------------------------------------------------

### Set Admin Roles

Users with these roles will be treated as Bot Admins:

!setup adminrole @Role

------------------------------------------------------------------------

## 3. Choose Which Roles Can Be Managed

### Roles Moderators Can Manage

!setup allowmod @Role

Moderators will be able to add/remove these roles.

------------------------------------------------------------------------

### Extra Roles Only Admins Can Manage

!setup allowadmin @Role

Admins can manage: - All Moderator roles - Plus these additional roles

------------------------------------------------------------------------

## 4. View Current Configuration

!setup show

This displays how many roles are configured in each category.

------------------------------------------------------------------------

## 5. Using the Bot

Add a role to a user:

!addcargo @Role @User

Remove a role from a user:

!remcargo @Role @User

Notes: - Commands are deleted automatically - Bot responses disappear
after a few seconds - Only configured staff roles can use these commands

------------------------------------------------------------------------

## 6. How Permissions Work

  User Type                 Access
  ------------------------- --------------------------------------
  Administrator (Discord)   Full access automatically
  Bot Admin Role            Can manage all allowed roles
  Moderator Role            Can manage roles set with `allowmod`
  Non-staff                 Commands are removed automatically

------------------------------------------------------------------------

## 7. Important: Role Hierarchy

If a role cannot be assigned:

1.  Go to **Server Settings → Roles**
2.  Move the bot role **above** the roles it needs to manage

Discord will not allow a bot to manage roles higher than its own.

------------------------------------------------------------------------

## 8. Troubleshooting

**Bot not responding** - Make sure the bot is online - Check you used
the correct command format

**Command deletes instantly** - You don't have a configured staff role

**Role won't assign** - Role not added with `allowmod` or `allowadmin` -
Bot role is too low in the role list

------------------------------------------------------------------------

## 9. What This Bot Does Well

-   Clean chat (auto-deletes commands and responses)
-   Clear Moderator/Admin separation
-   Prevents staff from assigning restricted roles
-   Per-server configuration (each server has its own setup)

------------------------------------------------------------------------

Once configured, the bot will follow your server's role structure
automatically.

------------------------------------------------------------------------

## 10. Dev Prefix File (Local Only)

For development, you can change the message-command prefix with:

/prefix value:<newPrefix>

Details:
- Only Discord server administrators can run `/prefix`
- `/prefix` is only registered when local `dev.features.json` has `"enablePrefixCommand": true`
- Prefix is stored in `dev.prefix.json` (gitignored)
- If `dev.prefix.json` does not exist, the bot defaults to `!`
- Use `dev.features.sample.json` and `dev.prefix.sample.json` as file format references
