import { EditorView, keymap, placeholder as cmPlaceholder, drawSelection, dropCursor, lineNumbers, ViewPlugin, Decoration, WidgetType } from '@codemirror/view';
import { EditorState, Compartment, RangeSetBuilder } from '@codemirror/state';
import {
    defaultKeymap, history, historyKeymap,
    indentWithTab,
    moveLineUp, moveLineDown,
    copyLineUp, copyLineDown,
    deleteLine
} from '@codemirror/commands';
import { indentUnit, syntaxHighlighting, defaultHighlightStyle, LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { search, highlightSelectionMatches } from '@codemirror/search';

let editorView = null;
let currentPlaceholder = '';
let changeListeners = [];
let selectionListeners = [];
let pendingImeResync = false;

// デフォルトタブサイズ
export const DEFAULT_TAB_SIZE = 4;

// 動的設定変更用 Compartments
export const wrapCompartment = new Compartment();
export const lineNumbersCompartment = new Compartment();
export const indentGuidesCompartment = new Compartment();
export const invisibleCharsCompartment = new Compartment();
export const indentCompartment = new Compartment();
export const themeCompartment = new Compartment();
export const languageCompartment = new Compartment();

/**
 * ファイル名から対応する CodeMirror LanguageSupport を取得（非同期）
 * @param {string} fileName 
 * @returns {Promise<import('@codemirror/language').LanguageSupport|null>}
 */
export async function getLanguageSupport(fileName) {
    if (!fileName) return null;

    let targetName = fileName;
    if (fileName.toLowerCase().endsWith('.ncmd')) {
        targetName = fileName.slice(0, -5) + '.md';
    } else if (fileName.toLowerCase().endsWith('.nctx')) {
        return null;
    }

    const desc = LanguageDescription.matchFilename(languages, targetName);
    if (desc) {
        try {
            return await desc.load();
        } catch (e) {
            console.warn(`Failed to load language support for ${fileName}:`, e);
            return null;
        }
    }
    return null;
}

/**
 * タイムスタンプ挿入コマンド (F5)
 * @param {EditorView} view
 * @returns {boolean}
 */
export function insertTimestampCommand(view) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}/${month}/${day} ${hours}:${minutes}`;

    const mainSel = view.state.selection.main;
    const newPos = mainSel.from + timestamp.length;

    view.dispatch({
        changes: { from: mainSel.from, to: mainSel.to, insert: timestamp },
        selection: { anchor: newPos, head: newPos },
        scrollIntoView: true,
    });
    return true;
}

/**
 * エディタ操作用カスタムキーマップ
 */
export const customEditorKeymap = [
    indentWithTab,
    { key: "Alt-ArrowUp", run: moveLineUp },
    { key: "Alt-ArrowDown", run: moveLineDown },
    { key: "Shift-Alt-ArrowUp", run: copyLineUp },
    { key: "Shift-Alt-ArrowDown", run: copyLineDown },
    { key: "Alt-Shift-k", run: deleteLine },
    { key: "Alt-Shift-K", run: deleteLine },
    { key: "F5", run: (view) => {
        if (view.composing) return false;
        return insertTimestampCommand(view);
    }},
];

/**
 * インデントガイド描画用ウィジェット
 */
class IndentGuideWidget extends WidgetType {
    constructor(levels) {
        super();
        this.levels = levels;
    }

    eq(other) {
        if (this.levels.length !== other.levels.length) return false;
        for (let i = 0; i < this.levels.length; i++) {
            if (this.levels[i] !== other.levels[i]) return false;
        }
        return true;
    }

    toDOM() {
        const wrap = document.createElement('span');
        wrap.className = 'cm-indent-guides';
        wrap.setAttribute('aria-hidden', 'true');

        for (const col of this.levels) {
            const guide = document.createElement('span');
            guide.className = 'cm-indent-guide';
            guide.style.left = `calc(16px + ${col}ch)`;
            wrap.appendChild(guide);
        }
        return wrap;
    }

    ignoreEvent() {
        return true;
    }
}

/**
 * 行テキストからインデント深さ・空白行情報を算出
 * @param {string} lineText
 * @param {number} tabSize
 * @param {number} indentUnitWidth
 * @returns {{ level: number, isBlank: boolean }}
 */
function getLineIndentInfo(lineText, tabSize, indentUnitWidth) {
    let col = 0;
    let index = 0;
    while (index < lineText.length) {
        const ch = lineText[index];
        if (ch === ' ') {
            col += 1;
            index += 1;
        } else if (ch === '\t') {
            col += tabSize - (col % tabSize);
            index += 1;
        } else {
            break;
        }
    }
    const isBlank = index === lineText.length;
    const level = Math.floor(col / indentUnitWidth);
    return { level, isBlank };
}

/**
 * 空行のインデント深さを前後の非空行から補間（VS Code準拠ロジック）
 * @param {import('@codemirror/state').Text} doc
 * @param {number} lineNumber
 * @param {number} tabSize
 * @param {number} indentUnitWidth
 * @returns {number}
 */
function resolveBlankLineIndent(doc, lineNumber, tabSize, indentUnitWidth) {
    let prevLevel = -1;
    let nextLevel = -1;
    const maxLook = 100;

    for (let i = lineNumber - 1; i >= Math.max(1, lineNumber - maxLook); i--) {
        const l = doc.line(i);
        const info = getLineIndentInfo(l.text, tabSize, indentUnitWidth);
        if (!info.isBlank) {
            prevLevel = info.level;
            break;
        }
    }

    for (let i = lineNumber + 1; i <= Math.min(doc.lines, lineNumber + maxLook); i++) {
        const l = doc.line(i);
        const info = getLineIndentInfo(l.text, tabSize, indentUnitWidth);
        if (!info.isBlank) {
            nextLevel = info.level;
            break;
        }
    }

    if (prevLevel === -1 || nextLevel === -1) {
        return 0;
    }
    if (prevLevel < nextLevel) {
        return prevLevel + 1;
    }
    if (prevLevel === nextLevel) {
        return prevLevel;
    }
    return nextLevel + 1;
}

/**
 * インデントガイド描画用 ViewPlugin
 */
export const indentGuidesPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        const tabSizeChanged = update.startState.tabSize !== update.state.tabSize;
        const indentUnitChanged = update.startState.facet(indentUnit) !== update.state.facet(indentUnit);
        if (update.docChanged || update.viewportChanged || tabSizeChanged || indentUnitChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder();
        const tabSize = view.state.tabSize || DEFAULT_TAB_SIZE;
        const unitFacet = view.state.facet(indentUnit) || '    ';
        const indentUnitWidth = unitFacet.length > 0 && unitFacet !== '\t' ? unitFacet.length : tabSize;

        for (const { from, to } of view.visibleRanges) {
            let pos = from;
            while (pos <= to) {
                const line = view.state.doc.lineAt(pos);

                // 行頭が表示範囲に含まれている場合のみインデント計算および Widget 追加を実施
                if (line.from >= from) {
                    let { level, isBlank } = getLineIndentInfo(line.text, tabSize, indentUnitWidth);

                    if (isBlank) {
                        level = resolveBlankLineIndent(view.state.doc, line.number, tabSize, indentUnitWidth);
                    }

                    if (level > 0) {
                        const levels = [];
                        for (let i = 0; i < level; i++) {
                            levels.push(i * indentUnitWidth);
                        }
                        builder.add(line.from, line.from, Decoration.widget({
                            widget: new IndentGuideWidget(levels),
                            side: -1,
                        }));
                    }
                }

                pos = line.to + 1;
            }
        }

        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});

/**
 * 改行記号描画用ウィジェット
 */
class NewlineWidget extends WidgetType {
    toDOM() {
        const span = document.createElement('span');
        span.className = 'cm-invisible-newline';
        span.textContent = '↵';
        span.setAttribute('aria-hidden', 'true');
        return span;
    }

    eq(other) {
        return true;
    }

    ignoreEvent() {
        return true;
    }
}

const spaceDeco = Decoration.mark({ class: 'cm-invisible-space' });
const fullwidthDeco = Decoration.mark({ class: 'cm-invisible-fullwidth' });
const tabDeco = Decoration.mark({ class: 'cm-invisible-tab' });
const newlineWidgetDeco = Decoration.widget({ widget: new NewlineWidget(), side: 1 });

/**
 * 不可視文字（空白・タブ・改行記号）描画用 ViewPlugin
 */
export const invisibleCharactersPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder();
        const doc = view.state.doc;
        const docLines = doc.lines;

        for (const { from, to } of view.visibleRanges) {
            let pos = from;
            while (pos <= to) {
                const line = doc.lineAt(pos);
                const start = Math.max(from, line.from);
                const end = Math.min(to, line.to);

                for (let p = start; p < end; p++) {
                    const ch = line.text[p - line.from];
                    if (ch === ' ') {
                        builder.add(p, p + 1, spaceDeco);
                    } else if (ch === '\u3000') {
                        builder.add(p, p + 1, fullwidthDeco);
                    } else if (ch === '\t') {
                        builder.add(p, p + 1, tabDeco);
                    }
                }

                if (line.to <= to && line.number < docLines) {
                    builder.add(line.to, line.to, newlineWidgetDeco);
                }

                pos = line.to + 1;
            }
        }

        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});

/**
 * 基本テーマ（CSS変数連動）
 */
export const baseTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "transparent",
        color: "var(--text-primary)",
        fontFamily: "var(--editor-font-family)",
        fontSize: "var(--editor-font-size)",
        lineHeight: "var(--editor-line-height)",
    },
    ".cm-scroller": {
        fontFamily: "inherit",
        lineHeight: "inherit",
        overflow: "auto",
    },
    ".cm-content": {
        padding: "16px 0",
        caretColor: "var(--accent)",
    },
    ".cm-line": {
        padding: "0 16px",
        position: "relative",
    },
    ".cm-indent-guides": {
        position: "absolute",
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
        height: "100%",
        pointerEvents: "none",
        userSelect: "none",
    },
    ".cm-indent-guide": {
        position: "absolute",
        top: "0",
        bottom: "0",
        width: "1px",
        backgroundColor: "var(--indent-guide-color, rgba(255, 255, 255, 0.20))",
        pointerEvents: "none",
        userSelect: "none",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--accent, #4daafc)",
        borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "var(--editor-selection-bg) !important",
    },
    ".cm-placeholder": {
        color: "var(--text-secondary)",
        opacity: "0.6",
        fontStyle: "normal",
    },
    // ガター（行番号領域）スタイル
    ".cm-gutters": {
        backgroundColor: "var(--gutter-bg)",
        color: "var(--gutter-text)",
        borderRight: "1px solid var(--gutter-border)",
        userSelect: "none",
    },
    ".cm-gutterElement": {
        padding: "0 8px 0 12px",
        minWidth: "20px",
        textAlign: "right",
    },
    ".cm-activeLineGutter": {
        color: "var(--gutter-active-text)",
        fontWeight: "bold",
    },
    // 検索・選択マッチのハイライトスタイル
    ".cm-selectionMatch": {
        backgroundColor: "var(--search-match-bg)",
        borderRadius: "2px",
    },
    ".cm-searchMatch": {
        backgroundColor: "var(--search-match-bg)",
        boxShadow: "0 0 0 1px var(--search-match-border)",
        borderRadius: "2px",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "var(--search-current-bg)",
        boxShadow: "0 0 0 2px var(--search-current-border)",
        borderRadius: "2px",
    },
    // CodeMirror 検索パネル
    ".cm-panels": {
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--border)",
        fontFamily: "var(--editor-font-family, sans-serif)",
        fontSize: "13px",
    },
    ".cm-panels.cm-panels-top": {
        borderBottom: "1px solid var(--border)",
    },
    ".cm-panel.cm-search": {
        padding: "6px 12px",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center",
    },
    ".cm-panel.cm-search input[type=text]": {
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "3px 8px",
        fontSize: "12px",
        outline: "none",
        fontFamily: "inherit",
    },
    ".cm-panel.cm-search input[type=text]:focus": {
        borderColor: "var(--accent)",
    },
    ".cm-panel.cm-search button": {
        backgroundColor: "var(--bg-tertiary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "3px 10px",
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.15s ease",
    },
    ".cm-panel.cm-search button:hover": {
        backgroundColor: "var(--border)",
        borderColor: "var(--accent)",
    },
    ".cm-panel.cm-search label": {
        color: "var(--text-secondary)",
        fontSize: "12px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
    },
    ".cm-panel.cm-search button[name=close]": {
        marginLeft: "auto",
        backgroundColor: "transparent",
        border: "none",
        color: "var(--text-secondary)",
        fontSize: "14px",
        cursor: "pointer",
        padding: "2px 6px",
    },
    ".cm-panel.cm-search button[name=close]:hover": {
        color: "var(--text-primary)",
    }
});

/**
 * インデント拡張を取得
 * @param {string} tabBehavior - 'tab4' | 'tab2' | 'space4' | 'space2' | 'tab'
 * @returns {import('@codemirror/state').Extension}
 */
export function getIndentExtension(tabBehavior = 'tab4') {
    switch (tabBehavior) {
        case 'space2':
            return [indentUnit.of('  '), EditorState.tabSize.of(2)];
        case 'space4':
            return [indentUnit.of('    '), EditorState.tabSize.of(4)];
        case 'tab2':
            return [indentUnit.of('\t'), EditorState.tabSize.of(2)];
        case 'tab4':
        case 'tab':
        default:
            return [indentUnit.of('\t'), EditorState.tabSize.of(DEFAULT_TAB_SIZE)];
    }
}

/**
 * 共通の拡張機能（Extensions）を取得
 * @param {Object} [options]
 * @param {boolean} [options.wordWrap=true]
 * @param {boolean} [options.lineNumbers=false]
 * @param {string} [options.tabBehavior='tab4']
 * @param {import('@codemirror/language').LanguageSupport|Array} [options.languageSupport=[]]
 * @returns {Array}
 */
export function getDefaultExtensions(options = {}) {
    const wrap = options.wordWrap !== undefined ? options.wordWrap : true;
    const lineNumbersEnabled = options.lineNumbers !== undefined ? options.lineNumbers : false;
    const indentGuidesEnabled = options.indentGuides !== undefined ? options.indentGuides : false;
    const invisibleCharsEnabled = options.invisibleCharacters !== undefined ? options.invisibleCharacters : false;
    const tabBehavior = options.tabBehavior || 'tab4';
    const languageSupport = options.languageSupport || [];

    const extensions = [
        history(),
        drawSelection(),
        dropCursor(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageCompartment.of(languageSupport),
        search({ top: true }),
        highlightSelectionMatches(),
        themeCompartment.of(baseTheme),
        wrapCompartment.of(wrap ? EditorView.lineWrapping : []),
        lineNumbersCompartment.of(lineNumbersEnabled ? lineNumbers() : []),
        indentGuidesCompartment.of(indentGuidesEnabled ? indentGuidesPlugin : []),
        invisibleCharsCompartment.of(invisibleCharsEnabled ? invisibleCharactersPlugin : []),
        indentCompartment.of(getIndentExtension(tabBehavior)),
        keymap.of([
            ...customEditorKeymap,
            ...defaultKeymap,
            ...historyKeymap,
        ]),
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
 * @param {Object} [options={}] - オプション (wordWrap, tabBehavior, languageSupport 等)
 * @returns {EditorState}
 */
export function createTabState(initialContent = '', options = {}) {
    return EditorState.create({
        doc: initialContent,
        extensions: getDefaultExtensions(options),
    });
}

/**
 * ファイル名に応じて EditorView の言語ハイライトを動的に更新
 * @param {EditorView} view
 * @param {string} fileName
 */
export async function updateLanguageForFileName(view, fileName) {
    if (!view) return;
    const langSupport = await getLanguageSupport(fileName);
    view.dispatch({
        effects: languageCompartment.reconfigure(langSupport || [])
    });
}

/**
 * CodeMirror の初期化
 * @param {HTMLElement} parentEl - エディタを配置する親要素 (#editor)
 * @param {Object} options - 初期化オプション
 * @param {string} [options.initialContent=''] - 初期テキスト
 * @param {string} [options.placeholder=''] - プレースホルダー文字列
 * @param {boolean} [options.wordWrap=true] - 折り返し初期状態
 * @param {boolean} [options.lineNumbers=false] - 行番号初期状態
 * @param {string} [options.tabBehavior='tab4'] - インデント挙動 ('tab4' | 'tab2' | 'space4' | 'space2')
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

    const state = options.state || createTabState(options.initialContent || '', {
        wordWrap: options.wordWrap,
        lineNumbers: options.lineNumbers,
        indentGuides: options.indentGuides,
        invisibleCharacters: options.invisibleCharacters,
        tabBehavior: options.tabBehavior,
    });

    editorView = new EditorView({
        state,
        parent: parentEl,
    });

    editorView.contentDOM.addEventListener('compositionend', () => {
        if (pendingImeResync) {
            pendingImeResync = false;
            resyncEditorPosition();
        }
    });

    if (options.onScroll) {
        editorView.scrollDOM.addEventListener('scroll', (e) => {
            options.onScroll(editorView.scrollDOM.scrollLeft, e);
        });
    }

    return editorView;
}

/**
 * マルチディスプレイ移動時等にIMEのキャレット座標を再同期（リフレッシュ）する
 */
export function resyncEditorPosition() {
    if (!editorView) return;

    // IME変換中の場合はフォーカスを外すと入力が中断するため、変換確定後に遅延実行する
    if (editorView.composing) {
        pendingImeResync = true;
        return;
    }

    pendingImeResync = false;

    // エディタがフォーカス中、またはアクティブ要素がエディタ内の場合に再同期を実行
    if (editorView.hasFocus || document.activeElement === editorView.contentDOM) {
        editorView.requestMeasure();
        editorView.contentDOM.blur();
        setTimeout(() => {
            if (editorView) {
                editorView.focus();
                editorView.requestMeasure();
            }
        }, 30);
    }
}

/**
 * 折り返し（Line Wrapping）の動的更新
 * @param {boolean} enable
 */
export function updateWrap(enable) {
    if (!editorView) return;
    editorView.dispatch({
        effects: wrapCompartment.reconfigure(enable ? EditorView.lineWrapping : [])
    });
}

/**
 * 行番号（Line Numbers）の動的更新
 * @param {boolean} enable
 */
export function updateLineNumbers(enable) {
    if (!editorView) return;
    editorView.dispatch({
        effects: lineNumbersCompartment.reconfigure(enable ? lineNumbers() : [])
    });
}

/**
 * インデントガイド（Indent Guides）の動的更新
 * @param {boolean} enable
 */
export function updateIndentGuides(enable) {
    if (!editorView) return;
    editorView.dispatch({
        effects: indentGuidesCompartment.reconfigure(enable ? indentGuidesPlugin : [])
    });
}

/**
 * 不可視文字（Invisible Characters）の動的更新
 * @param {boolean} enable
 */
export function updateInvisibleCharacters(enable) {
    if (!editorView) return;
    editorView.dispatch({
        effects: invisibleCharsCompartment.reconfigure(enable ? invisibleCharactersPlugin : [])
    });
}

/**
 * インデント設定の動的更新
 * @param {string} tabBehavior - 'tab4' | 'tab2' | 'space4' | 'space2'
 */
export function updateIndent(tabBehavior) {
    if (!editorView) return;
    editorView.dispatch({
        effects: indentCompartment.reconfigure(getIndentExtension(tabBehavior))
    });
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

    const docLength = doc.length;
    const isSelected = !mainSel.empty;

    let totalChars = docLength;
    let selectedChars = 0;

    if (charCountMode === 'no_newline') {
        const newlineCount = doc.lines - 1;
        totalChars = docLength - newlineCount;

        if (isSelected) {
            const selectedText = doc.sliceString(mainSel.from, mainSel.to);
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

/**
 * 複数箇所を一括置換（1つのUndo履歴として記録）
 * @param {Array<{from: number, to: number, insert: string}>} changes
 */
export function replaceAllMatches(changes) {
    if (!editorView || !changes || changes.length === 0) return;

    editorView.dispatch({
        changes,
    });
}

/**
 * 指定範囲を選択し、中央付近へスムーズにスクロール
 * @param {number} from
 * @param {number} to
 */
export function selectAndScrollTo(from, to) {
    if (!editorView) return;
    const docLen = editorView.state.doc.length;
    const safeFrom = Math.max(0, Math.min(from, docLen));
    const safeTo = Math.max(0, Math.min(to, docLen));

    editorView.dispatch({
        selection: { anchor: safeFrom, head: safeTo },
        scrollIntoView: true,
    });
}

/**
 * 現在選択されている文字列を取得
 * @returns {string}
 */
export function getSelectionText() {
    if (!editorView) return '';
    const mainSel = editorView.state.selection.main;
    if (mainSel.empty) return '';
    return editorView.state.doc.sliceString(mainSel.from, mainSel.to);
}

/**
 * 現在のドキュメントの総行数を取得
 * @returns {number}
 */
export function getTotalLines() {
    if (!editorView) return 1;
    return editorView.state.doc.lines;
}

/**
 * 指定された行と列にキャレットを移動し、エディタ中央へスクロール
 * @param {number} lineNum - 1始まりの行番号
 * @param {number} [colNum=1] - 1始まりの列番号
 * @returns {boolean} 成功したかどうか
 */
export function gotoLineAndColumn(lineNum, colNum = 1) {
    if (!editorView) return false;
    const doc = editorView.state.doc;
    const totalLines = doc.lines;
    const safeLine = Math.max(1, Math.min(lineNum, totalLines));
    const lineInfo = doc.line(safeLine);
    const colOffset = Math.max(0, Math.min((colNum || 1) - 1, lineInfo.length));
    const targetPos = lineInfo.from + colOffset;

    editorView.dispatch({
        selection: { anchor: targetPos, head: targetPos },
        effects: EditorView.scrollIntoView(targetPos, { y: 'center' }),
    });
    return true;
}

