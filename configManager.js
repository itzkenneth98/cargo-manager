const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'configs');

function getConfig(guildId) {
    const file = path.join(configPath, `${guildId}.json`);

    if (!fs.existsSync(file)) {
        const defaultConfig = {
            modRoles: [],
            adminRoles: [],
            modAllowedRoles: [],
            adminAllowedRoles: []
        };

        fs.writeFileSync(file, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }

    return JSON.parse(fs.readFileSync(file));
}

function saveConfig(guildId, config) {
    const file = path.join(configPath, `${guildId}.json`);
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
}

module.exports = { getConfig, saveConfig };