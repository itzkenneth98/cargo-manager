const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'configs');

function getDefaultConfig() {
    return {
        modRoles: [],
        adminRoles: [],
        modAllowedRoles: [],
        adminAllowedRoles: [],
        logChannelId: null
    };
}

function getConfig(guildId) {
    const file = path.join(configPath, `${guildId}.json`);

    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath);
    }

    if (!fs.existsSync(file)) {
        const defaultConfig = getDefaultConfig();
        fs.writeFileSync(file, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }

    const config = JSON.parse(fs.readFileSync(file));

    // Ensure new fields exist (backwards compatibility)
    const defaults = getDefaultConfig();
    for (const key in defaults) {
        if (!(key in config)) {
            config[key] = defaults[key];
        }
    }

    return config;
}

function saveConfig(guildId, config) {
    const file = path.join(configPath, `${guildId}.json`);
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
}

module.exports = { getConfig, saveConfig };