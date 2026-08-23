import { EditorView, keymap, placeholder as cmPlaceholder, drawSelection, dropCursor } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

let editorView = null;
let currentPlaceholder = '';
let changeListeners = [];
let selectionListeners = [];

/**
 * 共通の拡張機能（Extensions）を取得
 * @returns {Array}
 */
export function getDefaultExtensions() {
    const extensions = [
        history(),
        drawSelection(),
        dropCursor(),
        keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
        ]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                changeListeners.forEach(listener => listener(update));
            }
            if (update.selectionSet || update.docChanged) {
                selectionListeners.forEach(listener => listener(update));
            }
        }),
    ];

    if (currentPlaceholder) {
        extensions.push(cmPlaceholder(currentPlaceholder));
    }

    return extensions;
}

/**
 * 新規タブ用の EditorState を生成
 * @param {string} [initialContent=''] - 初期テキスト
 * @returns {EditorState}
 */
export function createTabState(initialContent = '') {
    return EditorState.create({
        doc: initialContent,
        extensions: getDefaultExtensions(),
    });
}

/**
 * CodeMirror の初期化
 * @param {HTMLElement} parentEl - エディタを配置する親要素 (#editor)
 * @param {Object} options - 初期化オプション
 * @param {string} [options.initialContent=''] - 初期テキスト
 * @param {string} [options.placeholder=''] - プレースホルダー文字列
 * @param {EditorState} [options.state] - 初期 EditorState
 * @param {Function} [options.onDocChange] - ドキュメント変更時コールバック
 * @param {Function} [options.onSelectionChange] - 選択範囲・カーソル変更時コールバック
 * @returns {EditorView}
 */
export function initCodeMirror(parentEl, options = {}) {
    if (editorView) {
        editorView.destroy();
        editorView = null;
    }

    if (options.onDocChange) {
        changeListeners = [options.onDocChange];
    }
    if (options.onSelectionChange) {
        selectionListeners = [options.onSelectionChange];
    }
    if (options.placeholder) {
        currentPlaceholder = options.placeholder;
    }

    const state = options.state || createTabState(options.initialContent || '');

    editorView = new EditorView({
        state,
        parent: parentEl,
    });

    return editorView;
}

/**
 * 現在の EditorView インスタンスを取得
 * @returns {EditorView|null}
 */
export function getEditorView() {
    return editorView;
}

/**
 * 現在の EditorState を取得
 * @returns {EditorState|null}
 */
export function getEditorState() {
    return editorView ? editorView.state : null;
}

/**
 * EditorState をエディタに丸ごと設定（タブ切り替え用）
 * @param {EditorState} state
 */
export function setEditorState(state) {
    if (!editorView || !state) return;
    editorView.setState(state);
}

/**
 * エディタ内のテキスト全文を取得
 * @returns {string}
 */
export function getContent() {
    if (!editorView) return '';
    return editorView.state.doc.toString();
}

/**
 * エディタ内のテキストを設定
 * @param {string} text - 設定するテキスト
 * @param {boolean} [clearHistory=false] - 履歴をクリアして新しい状態にするか
 */
export function setContent(text, clearHistory = false) {
    if (!editorView) return;

    if (clearHistory) {
        const newState = createTabState(text);
        editorView.setState(newState);
    } else {
        const currentDocLen = editorView.state.doc.length;
        editorView.dispatch({
            changes: { from: 0, to: currentDocLen, insert: text },
        });
    }
}

/**
 * 現在の選択範囲・カーソル位置を取得
 * @returns {{ from: number, to: number, head: number, anchor: number, empty: boolean }}
 */
export function getSelection() {
    if (!editorView) {
        return { from: 0, to: 0, head: 0, anchor: 0, empty: true };
    }
    const mainSel = editorView.state.selection.main;
    return {
        from: mainSel.from,
        to: mainSel.to,
        head: mainSel.head,
        anchor: mainSel.anchor,
        empty: mainSel.empty,
    };
}

/**
 * 選択範囲・カーソル位置を設定
 * @param {number} anchor - 選択開始位置
 * @param {number} [head=anchor] - 選択終了位置
 */
export function setSelection(anchor, head = anchor) {
    if (!editorView) return;
    const docLen = editorView.state.doc.length;
    const safeAnchor = Math.max(0, Math.min(anchor, docLen));
    const safeHead = Math.max(0, Math.min(head, docLen));

    editorView.dispatch({
        selection: { anchor: safeAnchor, head: safeHead },
        scrollIntoView: true,
    });
}

/**
 * エディタにフォーカスを設定
 */
export function focusEditor() {
    if (editorView) {
        editorView.focus();
    }
}

/**
 * 現在のカーソル位置およびテキスト統計情報を取得（ステータスバー用）
 * @returns {{ line: number, col: number, totalChars: number, selectedChars: number, isSelected: boolean, docLength: number }}
 */
export function getCursorMetrics(charCountMode = 'with_newline') {
    if (!editorView) {
        return { line: 1, col: 1, totalChars: 0, selectedChars: 0, isSelected: false, docLength: 0 };
    }

    const state = editorView.state;
    const doc = state.doc;
    const mainSel = state.selection.main;
    const head = mainSel.head;

    // 行・列番号の算出
    const lineObj = doc.lineAt(head);
    const line = lineObj.number;
    const col = head - lineObj.from + 1;

    const fullText = doc.toString();
    const docLength = doc.length;
    const isSelected = !mainSel.empty;

    let totalChars = fullText.length;
    let selectedChars = 0;

    if (charCountMode === 'no_newline') {
        const newlineCount = (fullText.match(/[\r\n]/g) || []).length;
        totalChars = fullText.length - newlineCount;

        if (isSelected) {
            const selectedText = fullText.substring(mainSel.from, mainSel.to);
            const selNewlines = (selectedText.match(/[\r\n]/g) || []).length;
            selectedChars = selectedText.length - selNewlines;
        }
    } else {
        if (isSelected) {
            selectedChars = mainSel.to - mainSel.from;
        }
    }

    return {
        line,
        col,
        totalChars,
        selectedChars,
        isSelected,
        docLength,
    };
}

/**
 * テキスト置換ヘルパー（Undo履歴対応）
 * @param {number} from - 置換開始インデックス
 * @param {number} to - 置換終了インデックス
 * @param {string} insertText - 挿入するテキスト
 * @param {number} [newCursorPos] - 置換後のカーソル位置
 */
export function replaceRange(from, to, insertText, newCursorPos) {
    if (!editorView) return;

    const transaction = {
        changes: { from, to, insert: insertText },
    };

    if (newCursorPos !== undefined) {
        transaction.selection = { anchor: newCursorPos, head: newCursorPos };
    }

    editorView.dispatch(transaction);
}
