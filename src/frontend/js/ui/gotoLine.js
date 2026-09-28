/**
 * 指定行ジャンプUIモジュール (gotoLine.js)
 * CodeMirror 6 と連携し、右上フロート型のコンパクトなUIで指定行・列へのジャンプ機能を提供します。
 * 正の行番号、行末からの逆算指定（マイナス記号）、コロンによる列指定に対応します。
 */

import {
    getTotalLines,
    gotoLineAndColumn,
    focusEditor,
} from './codemirror.js';
import { t } from '../../i18n.js';
import { closeFind } from './findReplace.js';

let elements = {
    widget: null,
    inputContainer: null,
    input: null,
    rangeHint: null,
    jumpBtn: null,
    closeBtn: null,
    errorMsg: null,
};

/**
 * 入力文字列をパースし、バリデーションを行う
 * @param {string} rawInput 
 * @param {number} totalLines 
 * @returns {{ valid: boolean, line?: number, col?: number, error?: string }}
 */
export function parseGotoInput(rawInput, totalLines) {
    const text = (rawInput || '').trim();
    if (!text) {
        return { valid: false, error: '' };
    }

    // 書式チェック: 先頭に任意で + または -、1桁以上の数字、任意でコロンと1桁以上の数字
    const pattern = /^[+-]?\d+(?::\d+)?$/;
    if (!pattern.test(text)) {
        return { valid: false, error: t('ui.goto.error.invalid') };
    }

    const parts = text.split(':');
    const lineVal = parseInt(parts[0], 10);
    const colVal = parts[1] !== undefined ? parseInt(parts[1], 10) : 1;

    if (isNaN(lineVal) || lineVal === 0) {
        return { valid: false, error: t('ui.goto.error.range', { max: totalLines }) };
    }

    let targetLine = 1;
    if (lineVal > 0) {
        targetLine = lineVal;
    } else {
        // 行末からの逆算: 総行数 - |lineVal| + 1
        targetLine = totalLines + lineVal + 1;
    }

    if (targetLine < 1 || targetLine > totalLines) {
        return { valid: false, error: t('ui.goto.error.range', { max: totalLines }) };
    }

    return {
        valid: true,
        line: targetLine,
        col: Math.max(1, colVal),
    };
}

/**
 * 指定行ジャンプモジュールの初期化
 */
export function initGotoLine() {
    elements.widget = document.getElementById('gotoLineWidget');
    if (!elements.widget) return;

    elements.inputContainer = elements.widget.querySelector('.input-with-range');
    elements.input = document.getElementById('gotoInput');
    elements.rangeHint = document.getElementById('gotoRangeHint');
    elements.jumpBtn = document.getElementById('gotoJumpBtn');
    elements.closeBtn = document.getElementById('closeGotoBtn');
    elements.errorMsg = document.getElementById('gotoErrorMsg');

    setupEventListeners();
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    if (!elements.input) return;

    // 入力中のリアルタイムバリデーション
    elements.input.addEventListener('input', () => {
        validateInput();
    });

    // キーボード操作
    elements.input.addEventListener('keydown', (e) => {
        if (e.isComposing) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            executeJump();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeGoto();
        }
    });

    // ジャンプボタン押下
    if (elements.jumpBtn) {
        elements.jumpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            executeJump();
        });
    }

    // 閉じるボタン押下
    if (elements.closeBtn) {
        elements.closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeGoto();
        });
    }
}

/**
 * 入力値の検証とUI表示の更新
 * @returns {boolean} 有効かどうか
 */
function validateInput() {
    if (!elements.input) return false;

    const totalLines = getTotalLines();
    const result = parseGotoInput(elements.input.value, totalLines);

    if (result.valid) {
        clearError();
        return true;
    } else {
        if (result.error) {
            showError(result.error);
        } else {
            // 空入力の場合は枠線エラーだけ解除し、メッセージは非表示
            clearError();
        }
        return false;
    }
}

/**
 * エラー状態を表示
 * @param {string} msg 
 */
function showError(msg) {
    if (elements.inputContainer) {
        elements.inputContainer.classList.add('error');
    }
    if (elements.errorMsg) {
        elements.errorMsg.textContent = msg;
        elements.errorMsg.classList.remove('hidden');
    }
}

/**
 * エラー状態をクリア
 */
function clearError() {
    if (elements.inputContainer) {
        elements.inputContainer.classList.remove('error');
    }
    if (elements.errorMsg) {
        elements.errorMsg.textContent = '';
        elements.errorMsg.classList.add('hidden');
    }
}

/**
 * ジャンプを実行
 */
function executeJump() {
    const totalLines = getTotalLines();
    const result = parseGotoInput(elements.input.value, totalLines);

    if (!result.valid) {
        if (result.error) {
            showError(result.error);
        } else {
            showError(t('ui.goto.error.invalid'));
        }
        return;
    }

    gotoLineAndColumn(result.line, result.col);
    closeGoto();
}

/**
 * 指定行ジャンプパネルが開いているか
 * @returns {boolean}
 */
export function isGotoOpen() {
    return elements.widget && !elements.widget.classList.contains('hidden');
}

/**
 * 指定行ジャンプパネルを開く
 */
export function openGoto() {
    if (!elements.widget) return;

    // 検索・置換パネルが開いていれば排他で閉じる
    closeFind();

    const totalLines = getTotalLines();
    if (elements.rangeHint) {
        elements.rangeHint.textContent = t('ui.goto.range', { max: totalLines });
    }

    clearError();
    elements.widget.classList.remove('hidden');

    if (elements.input) {
        elements.input.focus();
        elements.input.select();
        // 既存値があれば即座にチェック
        if (elements.input.value.trim()) {
            validateInput();
        }
    }
}

/**
 * 指定行ジャンプパネルを閉じる
 */
export function closeGoto() {
    if (!elements.widget) return;

    elements.widget.classList.add('hidden');
    clearError();
    focusEditor();
}

/**
 * 指定行ジャンプパネルの開閉をトグル
 */
export function toggleGoto() {
    if (isGotoOpen()) {
        closeGoto();
    } else {
        openGoto();
    }
}
