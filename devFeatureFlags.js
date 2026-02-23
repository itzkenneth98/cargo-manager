const fs = require('fs');
const path = require('path');

const devFeaturesPath = path.join(__dirname, 'dev.features.json');

function isPrefixCommandEnabled() {
    if (!fs.existsSync(devFeaturesPath)) return false;

    try {
        const raw = fs.readFileSync(devFeaturesPath, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed?.enablePrefixCommand === true;
    } catch {
        return false;
    }
}

module.exports = {
    isPrefixCommandEnabled
};
