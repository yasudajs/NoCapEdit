import { t } from '../../i18n.js';
import { appState, elements } from '../state.js';
import { MAX_FONT_SIZE, MIN_FONT_SIZE, MAX_LINE_HEIGHT, MIN_LINE_HEIGHT, LINE_HEIGHT_STEP, AUTOSAVE_DELAY_MS } from '../state.js';
import { renderTabs, updateTabStatus } from './tabs.js';
import { autoSave } from '../core/fileSystem.js';
import { getContent, setContent, getCursorMetrics, getSelection, setSelection, replaceRange, focusEditor } from './codemirror.js';

export function syncCurrentEditorToState() {
    if (!appState.currentTab) {
        return;
    }
    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) {
        return;
    }

    tab.content = getContent();
}

export function updateEditorMetrics() {
    if (!elements.statusMetrics) return;

    const metrics = getCursorMetrics(appState.charCountMode || 'with_newline');

    let charDisplay = '';
    if (metrics.isSelected) {
        charDisplay = t('editor.metrics.selection', { selected: metrics.selectedChars, total: metrics.totalChars });
    } else {
        charDisplay = t('editor.metrics.length', { total: metrics.totalChars });
    }

    const lh = appState.lineHeight || 1.5;
    const fs = appState.fontSize || 20;

    const positionStr = t('editor.metrics.position', { line: metrics.line, col: metrics.col });
    const fontStr = t('editor.metrics.font', { size: fs });
    const lhStr = t('editor.metrics.lh', { lh: lh.toFixed(1) });
    elements.statusMetrics.textContent = `${positionStr} | ${charDisplay} | ${fontStr} | ${lhStr}`;
}

export function onEditorInput() {
    if (!appState.currentTab) return;

    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) return;

    tab.content = getContent();
    tab.isDirty = true;
    renderTabs();
    updateEditorMetrics();

    updateTabStatus(tab, t('tabs.state.editing'));

    // 自動保存タイマーをリセット
    if (appState.saveMode !== 'manual') {
        clearTimeout(appState.autosaveTimer);
        appState.autosaveTimer = setTimeout(() => {
            autoSave();
        }, AUTOSAVE_DELAY_MS);
    }
}

export function zoomIn() {
    if (appState.fontSize < MAX_FONT_SIZE) {
        appState.fontSize = Math.min(MAX_FONT_SIZE, appState.fontSize + 1);
        applyFontSize();
    }
}

export function zoomOut() {
    if (appState.fontSize > MIN_FONT_SIZE) {
        appState.fontSize = Math.max(MIN_FONT_SIZE, appState.fontSize - 1);
        applyFontSize();
    }
}

export function applyFontSize() {
    if (appState.fontSize) {
        document.documentElement.style.setProperty('--editor-font-size', `${appState.fontSize}px`);
    }
    updateEditorMetrics();
}

export function applyLineHeight() {
    if (appState.lineHeight) {
        document.documentElement.style.setProperty('--editor-line-height', appState.lineHeight);
    }
    updateEditorMetrics();
}

export function increaseLineHeight() {
    if (appState.lineHeight < MAX_LINE_HEIGHT) {
        appState.lineHeight = Math.min(MAX_LINE_HEIGHT, appState.lineHeight + LINE_HEIGHT_STEP);
        applyLineHeight();
    }
}

export const DEFAULT_FONT_SIZE = 20;
export const DEFAULT_LINE_HEIGHT = 1.5;

export function resetZoomAndLineHeight() {
    appState.fontSize = appState.savedFontSize || DEFAULT_FONT_SIZE;
    appState.lineHeight = appState.savedLineHeight || DEFAULT_LINE_HEIGHT;
    applyFontSize();
    applyLineHeight();
}

export function decreaseLineHeight() {
    if (appState.lineHeight > MIN_LINE_HEIGHT) {
        appState.lineHeight = Math.max(MIN_LINE_HEIGHT, Number((appState.lineHeight - 0.1).toFixed(1)));
        applyLineHeight();
    }
}

/**
 * エディタの折り返し設定を適用する
 * @param {boolean} enable - 折り返しを有効にするかどうか
 */
export function applyWordWrap(enable) {
    // Step 4 で Compartment を通じた動的制御に完全移行
}

export function toggleWordWrap() {
    if (!appState.currentTab) return;
    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) return;
    const currentWrap = tab.wordWrap !== undefined ? tab.wordWrap : appState.wordWrap;
    const newWrap = !currentWrap;
    tab.wordWrap = newWrap;
    applyWordWrap(newWrap);
    console.log(`[WordWrap] タブ "${tab.fileName}" の折り返しを ${newWrap ? 'ON' : 'OFF'} に切り替えました`);
}

export function getIndentString() {
    switch (appState.tabBehavior) {
        case 'space2': return '  ';
        case 'space4': return '    ';
        case 'tab':
        default:
            return '\t';
    }
}

/**
 * テキスト置換ヘルパー（Undo対応）
 */
export function applyEditorTextWithUndo(replaceStart, replaceEnd, replacementText, newSelectionStart, newSelectionEnd) {
    replaceRange(replaceStart, replaceEnd, replacementText, newSelectionStart);
    if (newSelectionStart !== undefined && newSelectionEnd !== undefined && newSelectionStart !== newSelectionEnd) {
        setSelection(newSelectionStart, newSelectionEnd);
    }
}

export function handleTabKey(e) {
    // Step 5 で CodeMirror keymap に統合予定
}

export function moveLine(direction) {
    // Step 5 で CodeMirror コマンドに統合予定
}

export function duplicateLine(direction) {
    // Step 5 で CodeMirror コマンドに統合予定
}

export function deleteLine() {
    // Step 5 で CodeMirror コマンドに統合予定
}

// 現在日時の挿入 (YYYY/MM/DD HH:mm)
export function insertTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}/${month}/${day} ${hours}:${minutes}`;

    const sel = getSelection();
    const newPos = sel.from + timestamp.length;

    replaceRange(sel.from, sel.to, timestamp, newPos);
    updateEditorMetrics();
}
