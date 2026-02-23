require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { getConfig, saveConfig } = require('./configManager');
const { getPrefix, setPrefix } = require('./devPrefixManager');
const { isPrefixCommandEnabled } = require('./devFeatureFlags');

const TOKEN = process.env.TOKEN;
const RESPONSE_TIME = 4000;

const HELP_LINK = 'https://diagnostic-nickel-769.notion.site/CargoManager-310d9b7232008028aafbeaacbf4c652f?source=copy_link';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// ===== Helpers =====

async function sendTempMessage(channel, content) {
    const msg = await channel.send(content);
    setTimeout(() => msg.delete().catch(() => {}), RESPONSE_TIME);
}

function ensureConfig(config) {
    let changed = false;
    config.tiers = config.tiers || {};
    config.logChannelId = config.logChannelId || null;

    // Backward compatibility: map legacy mod/admin configs into tier format.
    if (Object.keys(config.tiers).length === 0) {
        const hasLegacyFields =
            Array.isArray(config.modRoles) ||
            Array.isArray(config.adminRoles) ||
            Array.isArray(config.modAllowedRoles) ||
            Array.isArray(config.adminAllowedRoles);

        if (hasLegacyFields) {
            config.tiers = {
                mod: {
                    priority: 1,
                    roles: [...(config.modRoles || [])],
                    allowedRoles: [...(config.modAllowedRoles || [])]
                },
                admin: {
                    priority: 2,
                    roles: [...(config.adminRoles || [])],
                    allowedRoles: [...(config.adminAllowedRoles || [])]
                }
            };
            changed = true;
        }
    }

    return changed;
}

async function sendLogEmbed(guild, config, embed) {
    if (!config.logChannelId) return;
    const channel = guild.channels.cache.get(config.logChannelId);
    if (!channel) return;
    channel.send({ embeds: [embed] }).catch(() => {});
}

function normalizeCommand(command, args) {
    if (command === 'add' && args[0]?.toLowerCase() === 'cargo') {
        args.shift();
        return 'addcargo';
    }
    if (command === 'rem' && args[0]?.toLowerCase() === 'cargo') {
        args.shift();
        return 'remcargo';
    }
    return command;
}

function getMemberTierAccess(member, config) {
    const memberRoleIds = new Set(member.roles.cache.keys());
    const tiers = Object.entries(config.tiers);

    const matched = tiers.filter(([, tier]) =>
        (tier.roles || []).some(roleId => memberRoleIds.has(roleId))
    );

    if (matched.length === 0) return null;

    const highestPriority = Math.max(
        ...matched.map(([, tier]) => Number.isFinite(tier.priority) ? tier.priority : 0)
    );

    const tierNames = matched
        .filter(([, tier]) => (Number.isFinite(tier.priority) ? tier.priority : 0) === highestPriority)
        .map(([name]) => name);

    const effectiveAllowedRoles = new Set();
    for (const [, tier] of tiers) {
        const priority = Number.isFinite(tier.priority) ? tier.priority : 0;
        if (priority <= highestPriority) {
            for (const roleId of tier.allowedRoles || []) {
                effectiveAllowedRoles.add(roleId);
            }
        }
    }

    return {
        highestPriority,
        tierNames,
        effectiveAllowedRoles
    };
}

// ===== Message Commands =====

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const prefix = getPrefix();
    if (!message.content.startsWith(prefix)) return;

    const guildId = message.guild.id;
    const config = getConfig(guildId);
    const configChanged = ensureConfig(config);
    if (configChanged) saveConfig(guildId, config);

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = normalizeCommand(args.shift().toLowerCase(), args);

    message.delete().catch(() => {});

    // =====================
    // SETUP COMMANDS
    // =====================

    if (command === 'setup') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return;

        const sub = args.shift()?.toLowerCase();
        const tierName = args.shift()?.toLowerCase();
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();

        // ===== Setup Log (fixed ping version) =====

        const setupLog = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Setup Command')
                .addFields(
                { name: 'User', value: `${message.member}`, inline: true },
                { name: 'Channel', value: `${message.channel}`, inline: true },
                { name: 'Command', value: `${prefix}setup ${sub || ''}` }
            )
            .setTimestamp();

        if (tierName) {
            setupLog.addFields({ name: 'Tier', value: tierName });
        }

        if (role) {
            setupLog.addFields({ name: 'Role', value: `${role}` });
        }

        if (channel) {
            setupLog.addFields({ name: 'Target Channel', value: `${channel}` });
        }

        sendLogEmbed(message.guild, config, setupLog);

        // ===== Setup Logic =====

        // CREATE TIER
        if (sub === 'createtier') {
            const priority = parseInt(args[0]);

            if (!tierName || isNaN(priority))
                return sendTempMessage(message.channel, 'Usage: !setup createtier <name> <priority>');

            if (config.tiers[tierName])
                return sendTempMessage(message.channel, 'Tier already exists.');

            config.tiers[tierName] = {
                priority,
                roles: [],
                allowedRoles: []
            };

            saveConfig(guildId, config);
            return sendTempMessage(message.channel, `Tier **${tierName}** created (priority ${priority}).`);
        }

        // CHANGE PRIORITY
        if (sub === 'settierpriority') {
            const priority = parseInt(args[0]);

            if (!config.tiers[tierName] || isNaN(priority))
                return sendTempMessage(message.channel, 'Usage: !setup settierpriority <name> <priority>');

            config.tiers[tierName].priority = priority;
            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Priority updated.');
        }

        // DELETE TIER
        if (sub === 'deletetier') {
            if (!config.tiers[tierName])
                return sendTempMessage(message.channel, 'Tier not found.');

            delete config.tiers[tierName];
            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Tier deleted.');
        }

        // STAFF ROLES
        if (sub === 'tierrole') {
            if (!config.tiers[tierName] || !role)
                return sendTempMessage(message.channel, 'Usage: !setup tierrole <tier> @Role');

            if (!config.tiers[tierName].roles.includes(role.id))
                config.tiers[tierName].roles.push(role.id);

            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Updated.');
        }

        if (sub === 'remtierrole') {
            if (!config.tiers[tierName] || !role)
                return sendTempMessage(message.channel, 'Usage: !setup remtierrole <tier> @Role');

            config.tiers[tierName].roles =
                config.tiers[tierName].roles.filter(id => id !== role.id);

            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Updated.');
        }

        // ALLOWED ROLES
        if (sub === 'allow') {
            if (!config.tiers[tierName] || !role)
                return sendTempMessage(message.channel, 'Usage: !setup allow <tier> @Role');

            if (!config.tiers[tierName].allowedRoles.includes(role.id))
                config.tiers[tierName].allowedRoles.push(role.id);

            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Updated.');
        }

        if (sub === 'remallow') {
            if (!config.tiers[tierName] || !role)
                return sendTempMessage(message.channel, 'Usage: !setup remallow <tier> @Role');

            config.tiers[tierName].allowedRoles =
                config.tiers[tierName].allowedRoles.filter(id => id !== role.id);

            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Updated.');
        }

        // LOG CHANNEL
        if (sub === 'logs') {
            if (args[0]?.toLowerCase() === 'off') {
                config.logChannelId = null;
                saveConfig(guildId, config);
                return sendTempMessage(message.channel, 'Logs disabled.');
            }

            if (!channel)
                return sendTempMessage(message.channel, 'Mention a channel.');

            config.logChannelId = channel.id;
            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Log channel set.');
        }

        // RESET CONFIG
        if (sub === 'reset') {
            config.tiers = {};
            config.logChannelId = null;

            // Clear legacy fields so ensureConfig doesn't recreate tiers from old data.
            config.modRoles = [];
            config.adminRoles = [];
            config.modAllowedRoles = [];
            config.adminAllowedRoles = [];

            saveConfig(guildId, config);
            return sendTempMessage(message.channel, 'Setup reset complete.');
        }

        // LIST (unchanged)
        if (sub === 'list') {
            const formatRoleList = (roleIds) => {
                if (!roleIds?.length) return '`None`';
                return roleIds.map(id => `<@&${id}>`).join(' • ');
            };

            const embed = new EmbedBuilder()
                .setTitle('CargoManager Tiers')
                .setColor(0x5865F2)
                .setTimestamp();

            const tiers = Object.entries(config.tiers)
                .sort((a, b) => b[1].priority - a[1].priority);

            if (tiers.length === 0) {
                embed.setDescription('No tiers configured.');
            } else {
                embed.setDescription(
                    `Configured tiers: **${tiers.length}**\n────────────────────`
                );

                for (let i = 0; i < tiers.length; i++) {
                    const [name, tier] = tiers[i];
                    const staffRoles = Array.isArray(tier.roles) ? tier.roles : [];
                    const allowedRoles = Array.isArray(tier.allowedRoles) ? tier.allowedRoles : [];
                    const priority = Number.isFinite(tier.priority) ? tier.priority : 0;
                    const divider = i < tiers.length - 1 ? '\n────────────────────' : '';

                    embed.addFields({
                        name: `${name.toUpperCase()} • Priority ${priority}`,
                        value:
                            `Staff (${staffRoles.length}): ${formatRoleList(staffRoles)}\n` +
                            `Allowed (${allowedRoles.length}): ${formatRoleList(allowedRoles)}` +
                            divider
                    });
                }
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_setup_${message.author.id}`)
                    .setLabel('Delete')
                    .setStyle(ButtonStyle.Danger)
            );

            return message.channel.send({
                content: `Requested by ${message.author}`,
                embeds: [embed],
                components: [row]
            });
        }
    }

    // ===== Role commands unchanged below =====
    // (your strict tier system + role logs stay exactly as before)
    if (command === 'addcargo' || command === 'remcargo') {
        const role = message.mentions.roles.first();
        const targetMember = message.mentions.members.filter(m => m.id !== message.author.id).first()
            || message.mentions.members.first();

        if (!role || !targetMember) {
            return sendTempMessage(
                message.channel,
                `Usage: ${prefix}${command} @Role @User`
            );
        }

        const access = getMemberTierAccess(message.member, config);
        if (!access) {
            return sendTempMessage(message.channel, 'You are not allowed to use cargo commands.');
        }

        if (!access.effectiveAllowedRoles.has(role.id)) {
            return sendTempMessage(message.channel, 'That role is not allowed for your tier.');
        }

        if (role.managed || role.id === message.guild.id) {
            return sendTempMessage(message.channel, 'That role cannot be managed by this bot.');
        }

        if (!role.editable) {
            return sendTempMessage(
                message.channel,
                'I cannot manage that role. Check role hierarchy and Manage Roles permission.'
            );
        }

        const adding = command === 'addcargo';
        const alreadyHasRole = targetMember.roles.cache.has(role.id);

        if (adding && alreadyHasRole) {
            return sendTempMessage(message.channel, `${targetMember} already has ${role}.`);
        }

        if (!adding && !alreadyHasRole) {
            return sendTempMessage(message.channel, `${targetMember} does not have ${role}.`);
        }

        try {
            if (adding) {
                await targetMember.roles.add(role, `Cargo add by ${message.author.tag}`);
            } else {
                await targetMember.roles.remove(role, `Cargo remove by ${message.author.tag}`);
            }

            await sendTempMessage(
                message.channel,
                `${adding ? 'Added' : 'Removed'} ${role} ${adding ? 'to' : 'from'} ${targetMember}.`
            );

            const roleLog = new EmbedBuilder()
                .setColor(adding ? 0x57F287 : 0xED4245)
                .setTitle(adding ? 'Cargo Role Added' : 'Cargo Role Removed')
                .addFields(
                    { name: 'Staff', value: `${message.member}`, inline: true },
                    { name: 'User', value: `${targetMember}`, inline: true },
                    { name: 'Role', value: `${role}`, inline: true },
                    { name: 'Tier', value: access.tierNames.join(', ') || 'Unknown', inline: true },
                    { name: 'Channel', value: `${message.channel}`, inline: true }
                )
                .setTimestamp();

            sendLogEmbed(message.guild, config, roleLog);
        } catch (error) {
            return sendTempMessage(
                message.channel,
                'Failed to update role. Check my permissions and role hierarchy.'
            );
        }
    }

});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'help') {
            await interaction.reply({
                content: HELP_LINK,
                ephemeral: true
            });
            return;
        }

        if (interaction.commandName === 'prefix') {
            if (!isPrefixCommandEnabled()) {
                await interaction.reply({
                    content: 'This command is disabled in this environment.',
                    ephemeral: true
                });
                return;
            }

            if (!interaction.inGuild()) {
                await interaction.reply({
                    content: 'This command can only be used in a server.',
                    ephemeral: true
                });
                return;
            }

            if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
                await interaction.reply({
                    content: 'Only administrators can change the prefix.',
                    ephemeral: true
                });
                return;
            }

            const requestedPrefix = interaction.options.getString('value', true);
            try {
                const updatedPrefix = setPrefix(requestedPrefix);
                await interaction.reply({
                    content: `Dev prefix updated to \`${updatedPrefix}\`.`,
                    ephemeral: true
                });
            } catch (error) {
                await interaction.reply({
                    content: `Failed to update prefix: ${error.message}`,
                    ephemeral: true
                });
            }
            return;
        }
    }

    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('delete_setup_')) return;

    const ownerId = interaction.customId.replace('delete_setup_', '');

    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: 'Only the command author can use this button.',
            ephemeral: true
        });
    }

    try {
        await interaction.deferUpdate();
        await interaction.message.delete().catch(() => {});
    } catch (error) {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'Failed to delete that message.',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

client.login(TOKEN);
