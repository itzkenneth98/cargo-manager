require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { isPrefixCommandEnabled } = require('./devFeatureFlags');

// Load from .env
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Optional: for instant testing, add your server ID to .env and uncomment below
// const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error('Missing TOKEN or CLIENT_ID in .env');
    process.exit(1);
}

const commands = [
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get setup instructions for Cargo Manager')
        .toJSON()
];

if (isPrefixCommandEnabled()) {
    commands.push(
        new SlashCommandBuilder()
            .setName('prefix')
            .setDescription('Set local dev message prefix (stored in dev.prefix.json)')
            .addStringOption((option) =>
                option
                    .setName('value')
                    .setDescription('Prefix to use, 1-5 non-whitespace characters')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(5)
            )
            .toJSON()
    );
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        // Global command (can take up to 1 hour to appear)
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        // ---- Instant testing option ----
        // Uncomment this instead of the global one if you want commands instantly
        /*
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        */

        console.log('Slash commands registered successfully.');
    } catch (error) {
        console.error('Failed to register commands:');
        console.error(error);
    }
})();
