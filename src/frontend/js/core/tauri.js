/**
 * Tauri API ラッパーモジュール
 * window.__TAURI__ がスクリプト読み込み後に注入される場合でも確実に動作するよう、
 * すべての API を実行時（動的）に解決する Proxy / ラッパーで提供します。
 */

function getTauri() {
    return window.__TAURI__ || null;
}

export const invoke = (...args) => {
    const tauri = getTauri();
    const inv = tauri?.tauri?.invoke || tauri?.invoke;
    if (inv) {
        return inv(...args);
    }
    return Promise.reject(new Error('Tauri invoke API is not available'));
};

export const openDialog = (...args) => {
    const tauri = getTauri();
    const open = tauri?.dialog?.open;
    if (open) {
        return open(...args);
    }
    return Promise.reject(new Error('Tauri dialog.open API is not available'));
};

export const saveDialog = (...args) => {
    const tauri = getTauri();
    const save = tauri?.dialog?.save;
    if (save) {
        return save(...args);
    }
    return Promise.reject(new Error('Tauri dialog.save API is not available'));
};

export const listen = (...args) => {
    const tauri = getTauri();
    const lst = tauri?.event?.listen;
    if (lst) {
        return lst(...args);
    }
    return Promise.reject(new Error('Tauri event.listen API is not available'));
};

export const emit = (...args) => {
    const tauri = getTauri();
    const emt = tauri?.event?.emit;
    if (emt) {
        return emt(...args);
    }
    return Promise.reject(new Error('Tauri event.emit API is not available'));
};

/**
 * appWindow の動的 Proxy
 */
export const appWindow = new Proxy({}, {
    get(_target, prop) {
        const tauri = getTauri();
        const win = tauri?.window?.appWindow;
        if (!win) {
            return undefined;
        }
        const val = win[prop];
        if (typeof val === 'function') {
            return val.bind(win);
        }
        return val;
    }
});

export function ensureTauriApi() {
    const tauri = getTauri();
    const inv = tauri?.tauri?.invoke || tauri?.invoke;
    if (!inv) {
        console.error('Tauri invoke API is not available.', window.__TAURI__);
        return false;
    }
    return true;
}
