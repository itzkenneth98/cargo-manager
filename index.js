require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { getConfig, saveConfig } = require('./configManager');

const TOKEN = process.env.TOKEN;
const PREFIX = '!';
const RESPONSE_TIME = 4000;

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

async function sendTempMessage(channel, content) {
    const msg = await channel.send(content);
    setTimeout(() => msg.delete().catch(() => {}), RESPONSE_TIME);
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const guildId = message.guild.id;
    const config = getConfig(guildId);

    // Delete command message
    message.delete().catch(() => {});

    // ===== SETUP COMMANDS =====
    if (command === 'setup') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return;
        }

        const sub = args.shift()?.toLowerCase();
        const role = message.mentions.roles.first();

        if (sub === 'show') {
            return sendTempMessage(message.channel,
                `ModRoles: ${config.modRoles.length}
AdminRoles: ${config.adminRoles.length}
ModAllowed: ${config.modAllowedRoles.length}
AdminAllowed: ${config.adminAllowedRoles.length}`
            );
        }

        if (!role) {
            return sendTempMessage(message.channel, 'Mention a role.');
        }

        if (sub === 'modrole') config.modRoles.push(role.id);
        if (sub === 'adminrole') config.adminRoles.push(role.id);
        if (sub === 'allowmod') config.modAllowedRoles.push(role.id);
        if (sub === 'allowadmin') config.adminAllowedRoles.push(role.id);

        saveConfig(guildId, config);
        return sendTempMessage(message.channel, 'Updated.');
    }

    // ===== PERMISSIONS =====
    const memberRoles = message.member.roles.cache;

    const isAdmin =
        message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
        config.adminRoles.some(id => memberRoles.has(id));

    const isMod =
        isAdmin ||
        config.modRoles.some(id => memberRoles.has(id));

    if (!isMod) return;

    const role = message.mentions.roles.first();
    const target = message.mentions.members.first();

    if (!role || !target) {
        return sendTempMessage(message.channel, 'Mention role and user.');
    }

    let allowed = [...config.modAllowedRoles];
    if (isAdmin) {
        allowed = [...allowed, ...config.adminAllowedRoles];
    }

    if (!allowed.includes(role.id)) {
        return sendTempMessage(message.channel, "You can't manage that role.");
    }

    if (role.position >= message.guild.members.me.roles.highest.position) {
        return sendTempMessage(message.channel, 'Bot role too low.');
    }

    try {
        if (command === 'addcargo') {
            await target.roles.add(role);
            return sendTempMessage(message.channel, 'Role added.');
        }

        if (command === 'remcargo') {
            await target.roles.remove(role);
            return sendTempMessage(message.channel, 'Role removed.');
        }
    } catch (err) {
        console.error(err);
    }
});

client.login(TOKEN);