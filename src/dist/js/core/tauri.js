import { updateStatus } from '../ui/tabs.js';

const tauriApi = window.__TAURI__ || null;
export const invoke = tauriApi?.tauri?.invoke || tauriApi?.invoke || null;
export const openDialog = tauriApi?.dialog?.open || null;
export const saveDialog = tauriApi?.dialog?.save || null;
export const appWindow = tauriApi?.window?.appWindow || null;
export const listen = tauriApi?.event?.listen || null;

export function ensureTauriApi() {
    if (!invoke) {
        console.error('Tauri invoke API is not available.', window.__TAURI__);
        updateStatus('Tauri API 初期化失敗', 'error');
        return false;
    }
    return true;
}
