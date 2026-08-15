import { t } from '../../i18n.js';
import { appState, elements } from '../state.js';
import { MAX_FONT_SIZE, MIN_FONT_SIZE, MAX_LINE_HEIGHT, MIN_LINE_HEIGHT, LINE_HEIGHT_STEP, AUTOSAVE_DELAY_MS } from '../state.js';
import { renderTabs, updateTabStatus } from './tabs.js';
import { autoSave } from '../core/fileSystem.js';
import { saveSettingsDelay } from '../core/settingsManager.js';

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
        charDisplay = t('editor.metrics.selection', { selected: selectedChars, total: chars });
    } else {
        charDisplay = t('editor.metrics.length', { total: chars });
    }

    const before = value.slice(0, caret);
    const lines = before.split('\n');
    const line = lines.length;
    const col = (lines[lines.length - 1] || '').length + 1;

    const lh = appState.lineHeight || 1.5;
    const fs = appState.fontSize || 13;
    
    const positionStr = t('editor.metrics.position', { line, col });
    const fontStr = t('editor.metrics.font', { size: fs });
    const lhStr = t('editor.metrics.lh', { lh: lh.toFixed(1) });
    elements.statusMetrics.textContent = `${positionStr} | ${charDisplay} | ${fontStr} | ${lhStr}`;
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

export const DEFAULT_FONT_SIZE = 20;
export const DEFAULT_LINE_HEIGHT = 1.5;

export function resetZoomAndLineHeight() {
    appState.fontSize = DEFAULT_FONT_SIZE;
    appState.lineHeight = DEFAULT_LINE_HEIGHT;
    applyFontSize();
    applyLineHeight();
}

export function decreaseLineHeight() {
    if (appState.lineHeight > MIN_LINE_HEIGHT) {
        appState.lineHeight = Math.max(MIN_LINE_HEIGHT, Number((appState.lineHeight - 0.1).toFixed(1)));
        applyLineHeight();
    }
}

export function applyWordWrap(enable) {
    if (!elements.editor) return;
    if (enable) {
        elements.editor.setAttribute('wrap', 'soft');
        elements.editor.classList.remove('word-wrap-off');
    } else {
        elements.editor.setAttribute('wrap', 'off');
        elements.editor.classList.add('word-wrap-off');
    }
}

export function toggleWordWrap() {
    if (!appState.currentTab) return;
    const currentWrap = appState.currentTab.wordWrap !== undefined ? appState.currentTab.wordWrap : appState.wordWrap;
    const newWrap = !currentWrap;
    appState.currentTab.wordWrap = newWrap;
    applyWordWrap(newWrap);
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

// Undo/Redoスタックを破壊せずに選択範囲のテキストを置換するヘルパー
function applyEditorTextWithUndo(replaceStart, replaceEnd, replacementText, newSelectionStart, newSelectionEnd) {
    if (!elements.editor) return;

    elements.editor.focus();
    elements.editor.setSelectionRange(replaceStart, replaceEnd);

    // document.execCommand('insertText') を使用することでブラウザネイティブのUndo/Redoスタックに正常に記録
    if (!document.execCommand('insertText', false, replacementText)) {
        // execCommand が失敗した場合のフォールバック
        elements.editor.setRangeText(replacementText, replaceStart, replaceEnd, 'end');
    }

    if (newSelectionStart !== undefined && newSelectionEnd !== undefined) {
        elements.editor.setSelectionRange(newSelectionStart, newSelectionEnd);
    }

    // 自動保存やステータス表示を連動
    elements.editor.dispatchEvent(new Event('input'));
}

export function handleTabKey(e) {
    if (e.key === 'Tab') {
        // 設定画面が開いている場合はエディタのインデント処理を行わず、ブラウザ標準のフォーカス移動を許可
        if (elements.settingsDialog && !elements.settingsDialog.classList.contains('hidden')) {
            return;
        }

        // CtrlキーやAltキーが同時に押されている場合は、タブ移動などのショートカットとして処理するため、ここでは無視する
        if (e.ctrlKey || e.altKey) {
            return;
        }

        e.preventDefault();

        const start = elements.editor.selectionStart;
        const end = elements.editor.selectionEnd;
        const value = elements.editor.value;
        const indentStr = getIndentString();

        // 選択範囲が複数行にまたがっているか判定
        const isMultiLine = value.substring(start, end).includes('\n') ||
            (start !== end && value.substring(0, start).lastIndexOf('\n') === start - 1);

        if (!e.shiftKey) {
            // -- 通常の Tab (インデント追加) --
            if (!isMultiLine) {
                // 単一行: カーソル位置にインデントを挿入
                applyEditorTextWithUndo(start, end, indentStr, start + indentStr.length, start + indentStr.length);
            } else {
                // 複数行: 選択行すべての先頭にインデントを追加
                const startLinePos = value.substring(0, start).lastIndexOf('\n') + 1;
                const endLinePos = value.indexOf('\n', end);
                const actualEndLinePos = endLinePos === -1 ? value.length : endLinePos;

                const targetText = value.substring(startLinePos, actualEndLinePos);
                const lines = targetText.split('\n');

                const newLines = lines.map(line => indentStr + line);
                const newText = newLines.join('\n');
                const insertedCount = lines.length * indentStr.length;

                applyEditorTextWithUndo(startLinePos, actualEndLinePos, newText, start + indentStr.length, end + insertedCount);
            }
        } else {
            // -- Shift + Tab (インデント削除) --
            const startLinePos = value.substring(0, start).lastIndexOf('\n') + 1;
            const endLinePos = value.indexOf('\n', end);
            const actualEndLinePos = endLinePos === -1 ? value.length : endLinePos;

            const targetText = value.substring(startLinePos, actualEndLinePos);
            const lines = targetText.split('\n');

            let firstLineRemovedCount = 0;
            let totalRemovedCount = 0;

            const newLines = lines.map((line, idx) => {
                let removed = 0;
                let newLine = line;

                if (line.startsWith(indentStr)) {
                    newLine = line.substring(indentStr.length);
                    removed = indentStr.length;
                } else if (line.startsWith('\t')) {
                    newLine = line.substring(1);
                    removed = 1;
                } else if (line.startsWith(' ')) {
                    const spaceMatch = line.match(/^ +/);
                    if (spaceMatch) {
                        const count = Math.min(spaceMatch[0].length, indentStr.length);
                        newLine = line.substring(count);
                        removed = count;
                    }
                }

                if (idx === 0) {
                    firstLineRemovedCount = removed;
                }
                totalRemovedCount += removed;
                return newLine;
            });

            const newText = newLines.join('\n');
            applyEditorTextWithUndo(
                startLinePos,
                actualEndLinePos,
                newText,
                Math.max(startLinePos, start - firstLineRemovedCount),
                Math.max(startLinePos, end - totalRemovedCount)
            );
        }
    }
}

// 選択範囲が跨る行全体の境界を取得するヘルパー
function getSelectionLineBounds() {
    if (!elements.editor) return null;
    const value = elements.editor.value;
    const start = elements.editor.selectionStart;
    const end = elements.editor.selectionEnd;

    // 選択開始位置が含まれる行の先頭
    const lineStart = (start === 0) ? 0 : value.lastIndexOf('\n', start - 1) + 1;

    // 選択終了位置が含まれる行の末尾
    // ※ start !== end かつ end が行頭 (\nの直後) の場合、その行は選択範囲に含めない
    let effectiveEnd = end;
    if (start !== end && end > lineStart && value[end - 1] === '\n') {
        effectiveEnd = end - 1;
    }

    const nextNewline = value.indexOf('\n', effectiveEnd);
    const lineEnd = (nextNewline === -1) ? value.length : nextNewline;

    return {
        start,
        end,
        lineStart,
        lineEnd,
        linesText: value.substring(lineStart, lineEnd)
    };
}

// 行の上下移動
export function moveLine(direction) {
    if (!elements.editor) return;
    const bounds = getSelectionLineBounds();
    if (!bounds) return;

    const { start, end, lineStart, lineEnd, linesText } = bounds;
    const value = elements.editor.value;

    if (direction === 'up') {
        if (lineStart === 0) return; // すでに最上行

        const prevLineStart = (lineStart === 1) ? 0 : value.lastIndexOf('\n', lineStart - 2) + 1;
        const prevLine = value.substring(prevLineStart, lineStart - 1);
        const offset = prevLine.length + 1;
        const newBlockText = linesText + '\n' + prevLine;

        applyEditorTextWithUndo(prevLineStart, lineEnd, newBlockText, start - offset, end - offset);
    } else if (direction === 'down') {
        if (lineEnd === value.length) return; // すでに最下行

        const nextNewline = value.indexOf('\n', lineEnd + 1);
        const nextLineEnd = (nextNewline === -1) ? value.length : nextNewline;
        const nextLine = value.substring(lineEnd + 1, nextLineEnd);
        const offset = nextLine.length + 1;
        const newBlockText = nextLine + '\n' + linesText;

        applyEditorTextWithUndo(lineStart, nextLineEnd, newBlockText, start + offset, end + offset);
    }
}

// 行の上下複製
export function duplicateLine(direction) {
    if (!elements.editor) return;
    const bounds = getSelectionLineBounds();
    if (!bounds) return;

    const { start, end, lineStart, lineEnd, linesText } = bounds;
    const offset = linesText.length + 1;

    if (direction === 'down') {
        applyEditorTextWithUndo(lineEnd, lineEnd, '\n' + linesText, start + offset, end + offset);
    } else if (direction === 'up') {
        applyEditorTextWithUndo(lineStart, lineStart, linesText + '\n', start, end);
    }
}

// 行の削除
export function deleteLine() {
    if (!elements.editor) return;
    const bounds = getSelectionLineBounds();
    if (!bounds) return;

    const { start, lineStart, lineEnd } = bounds;
    const value = elements.editor.value;
    const col = start - lineStart;

    let delStart = lineStart;
    let delEnd = lineEnd;

    if (lineEnd < value.length) {
        // 後ろに改行がある場合は改行を含めて削除
        delEnd = lineEnd + 1;
    } else if (lineStart > 0) {
        // 最終行で前に改行がある場合は手前の改行を含めて削除
        delStart = lineStart - 1;
    }

    const valueAfterDel = value.substring(0, delStart) + value.substring(delEnd);
    const newNextNewline = valueAfterDel.indexOf('\n', delStart);
    const newCurrentLineEnd = (newNextNewline === -1) ? valueAfterDel.length : newNextNewline;
    const newCursorPos = Math.min(delStart + col, newCurrentLineEnd);

    applyEditorTextWithUndo(delStart, delEnd, '', newCursorPos, newCursorPos);
}

// 現在日時の挿入 (YYYY/MM/DD HH:mm)
export function insertTimestamp() {
    if (!elements.editor) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}/${month}/${day} ${hours}:${minutes}`;

    const start = elements.editor.selectionStart;
    const end = elements.editor.selectionEnd;
    const newPos = start + timestamp.length;

    applyEditorTextWithUndo(start, end, timestamp, newPos, newPos);
}

