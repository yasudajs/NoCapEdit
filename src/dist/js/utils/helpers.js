export const AUTO_FILE_REGEX = /^\d{8}_\d{6}(_\d{2})?\.nctx$/;

export function generateTabId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function getFileNameFromPath(path) {
    if (!path) {
        return '';
    }
    const normalized = path.replace(/\\/g, '/');
    const chunks = normalized.split('/');
    return chunks[chunks.length - 1] || '';
}

export function isAutoCreatedFileName(fileName) {
    return AUTO_FILE_REGEX.test(fileName);
}

export function compareVersions(v1, v2) {
    const parts1 = String(v1).split('.').map(Number);
    const parts2 = String(v2).split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}
