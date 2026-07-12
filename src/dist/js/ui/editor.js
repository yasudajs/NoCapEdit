import { appState, elements } from '../state.js';
import { MAX_FONT_SIZE, MIN_FONT_SIZE, MAX_LINE_HEIGHT, MIN_LINE_HEIGHT, LINE_HEIGHT_STEP, AUTOSAVE_DELAY_MS } from '../state.js';
import { renderTabs, updateTabStatus } from './tabs.js';
import { autoSave } from '../core/fileSystem.js';
import { saveSettingsDelay } from './settings.js';

export function syncCurrentEditorToState() {
    if (!appState.currentTab) {
        return;
    }
    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) {
        return;
    }

    if (elements.editor) {
        tab.content = elements.editor.value;
    }
}

export function updateEditorMetrics() {
    if (!elements.editor || !elements.statusMetrics) return;

    const value = elements.editor.value || '';
    const caret = elements.editor.selectionStart || 0;
    const selectEnd = elements.editor.selectionEnd || 0;

    let chars = value.length;
    let selectedChars = 0;
    const isSelected = caret !== selectEnd;

    if (appState.charCountMode === 'no_newline') {
        const newlineCount = (value.match(/[\r\n]/g) || []).length;
        chars = value.length - newlineCount;

        if (isSelected) {
            const selectedText = value.substring(caret, selectEnd);
            const selectedNewlineCount = (selectedText.match(/[\r\n]/g) || []).length;
            selectedChars = selectedText.length - selectedNewlineCount;
        }
    } else {
        if (isSelected) {
            const selectedText = value.substring(caret, selectEnd);
            selectedChars = selectedText.length;
        }
    }

    let charDisplay = '';
    if (isSelected) {
        charDisplay = `${selectedChars} / ${chars} chars`;
    } else {
        charDisplay = `${chars} chars`;
    }

    const before = value.slice(0, caret);
    const lines = before.split('\n');
    const line = lines.length;
    const col = (lines[lines.length - 1] || '').length + 1;

    const lh = appState.lineHeight || 1.5;
    const fs = appState.fontSize || 13;
    elements.statusMetrics.textContent = `Ln ${line}, Col ${col} | ${charDisplay} | Font ${fs} pt | LH x ${lh.toFixed(1)}`;
}

export function onEditorInput(e) {
    if (!appState.currentTab) return;

    const tab = appState.tabs.find(t => t.id === appState.currentTab);
    if (!tab) return;

    if (elements.editor) {
        tab.content = elements.editor.value;
    }
    tab.isDirty = true;
    renderTabs();
    updateEditorMetrics();

    updateTabStatus(tab, '編集中');

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
    saveSettingsDelay();
}

export function applyLineHeight() {
    if (appState.lineHeight) {
        document.documentElement.style.setProperty('--editor-line-height', appState.lineHeight);
    }
    updateEditorMetrics();
    saveSettingsDelay();
}

export function increaseLineHeight() {
    if (appState.lineHeight < MAX_LINE_HEIGHT) {
        appState.lineHeight = Math.min(MAX_LINE_HEIGHT, appState.lineHeight + LINE_HEIGHT_STEP);
        applyLineHeight();
    }
}

export function decreaseLineHeight() {
    if (appState.lineHeight > MIN_LINE_HEIGHT) {
        appState.lineHeight = Math.max(MIN_LINE_HEIGHT, Number((appState.lineHeight - 0.1).toFixed(1)));
        applyLineHeight();
    }
}
