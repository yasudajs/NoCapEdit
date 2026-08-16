
const tauriApi = window.__TAURI__ || null;
export const invoke = tauriApi?.tauri?.invoke || tauriApi?.invoke || null;
export const openDialog = tauriApi?.dialog?.open || null;
export const saveDialog = tauriApi?.dialog?.save || null;
export const appWindow = tauriApi?.window?.appWindow || null;
export const listen = tauriApi?.event?.listen || null;
export const emit = tauriApi?.event?.emit || null;

/**
 * [WARNING] 循環参照の防止 (Circular Dependency Prevention)
 * 
 * tauri.js はアプリケーションの最下層（コア）に位置するAPIラッパーです。
 * ここから上位の UI 層モジュール（例: `ui/tabs.js` の `updateStatus` など）を
 * import して呼び出すと、循環参照が発生し起動時にクラッシュします。
 * 
 * エラー時の UI 通知（ステータス更新やダイアログ等）は、ここでは行わず、
 * `ensureTauriApi()` を呼び出した上位モジュール側の責任でハンドリングしてください。
 */
export function ensureTauriApi() {
    if (!invoke) {
        console.error('Tauri invoke API is not available.', window.__TAURI__);
        return false;
    }
    return true;
}
