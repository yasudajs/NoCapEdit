/**
 * ショートカットレジストリ
 * アプリケーション全体のキーボードショートカットを一元管理する。
 */

const shortcuts = [];

/**
 * ショートカットを登録する
 * @param {string|string[]} combo - ショートカットの組み合わせ (例: 'Ctrl+S', ['Ctrl++', 'Ctrl+='])
 * @param {Function} handler - 実行されるハンドラ関数 (eventを受け取る)
 * @param {Object} options - オプション (category, enabled, preventDefault など)
 */
export function registerShortcut(combo, handler, options = {}) {
    const combos = Array.isArray(combo) ? combo : [combo];
    
    combos.forEach(c => {
        const existing = shortcuts.find(s => s.combo === c);
        if (existing) {
            console.warn(`ショートカット競合: ${c} (${existing.category || 'unknown'} vs ${options.category || 'unknown'})`);
        }
        shortcuts.push({ 
            combo: c, 
            handler, 
            preventDefault: options.preventDefault !== false, // デフォルトでtrue
            ...options 
        });
    });
}

/**
 * KeyboardEvent からショートカット文字列の候補を組み立てる
 * @param {KeyboardEvent} e 
 * @returns {string[]} (例: ['Ctrl+S', 'Ctrl+KeyS'])
 */
function buildComboCandidates(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    
    const candidates = new Set();
    
    // e.key ベースのコンボ
    if (e.key) {
        let key = e.key;
        if (key.length === 1) {
            key = key.toUpperCase();
        } else {
            key = key.charAt(0).toUpperCase() + key.slice(1);
        }
        candidates.add([...parts, key].join('+'));
    }

    // e.code ベースのコンボ
    if (e.code) {
        let code = e.code;
        if (code.startsWith('Key')) {
            code = code.replace('Key', '');
        }
        candidates.add([...parts, code].join('+'));
    }
    
    return Array.from(candidates);
}

// グローバルキーボードリスナー
window.addEventListener('keydown', (e) => {
    const candidates = buildComboCandidates(e);
    
    for (const candidate of candidates) {
        for (const s of shortcuts) {
            if (s.combo === candidate && s.enabled !== false) {
                if (s.preventDefault) {
                    e.preventDefault();
                }
                
                // ハンドラの実行。非同期の場合もあるためそのまま呼び出す
                s.handler(e);
                
                // いずれかの候補にマッチしたら終了
                return;
            }
        }
    }
});
