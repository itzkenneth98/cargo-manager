const fs = require('fs');
const path = require('path');

const DEFAULT_PREFIX = '!';
const devConfigPath = path.join(__dirname, 'dev.prefix.json');

let cachedPrefix = null;

function normalizePrefix(prefix) {
    if (typeof prefix !== 'string') return null;
    const trimmed = prefix.trim();
    if (!trimmed || /\s/.test(trimmed) || trimmed.length > 5) return null;
    return trimmed;
}

function loadPrefix() {
    if (cachedPrefix !== null) return cachedPrefix;

    if (!fs.existsSync(devConfigPath)) {
        cachedPrefix = DEFAULT_PREFIX;
        return cachedPrefix;
    }

    try {
        const raw = fs.readFileSync(devConfigPath, 'utf8');
        const parsed = JSON.parse(raw);
        cachedPrefix = normalizePrefix(parsed?.prefix) || DEFAULT_PREFIX;
    } catch {
        cachedPrefix = DEFAULT_PREFIX;
    }

    return cachedPrefix;
}

function getPrefix() {
    return loadPrefix();
}

function setPrefix(prefix) {
    const normalized = normalizePrefix(prefix);
    if (!normalized) {
        throw new Error('Invalid prefix. Use 1-5 non-whitespace characters.');
    }

    fs.writeFileSync(devConfigPath, JSON.stringify({ prefix: normalized }, null, 2));
    cachedPrefix = normalized;
    return normalized;
}

module.exports = {
    DEFAULT_PREFIX,
    getPrefix,
    setPrefix
};
