// sidebar-integration.js — サイドバー統合モジュール（ブリッジ）
// main.js とサイドバーモジュール間の橋渡し役。
// 後続フェーズで、サイドバー関連の初期化・ショートカット登録・FS監視連携・設定保存を集約する。

import { initSidebar, focusSidebarTree, createItemGlobally } from './sidebar.js';
import { appState, elements } from '../state.js';
import { registerShortcut } from '../shortcuts.js';

/**
 * サイドバー統合の初期化
 * 現時点では initSidebar() を呼ぶだけのラッパー。
 * 後続フェーズで以下の責務を段階的に引き受ける:
 * - フェーズ2: サイドバー初期表示制御（sidebarVisible/sidebarWidth の読込と適用）
 * - フェーズ4: サイドバー用ショートカットの登録（Ctrl+E/N/D）
 * - フェーズ5: ファイルシステム監視のサイドバー部分
 * - フェーズ6: サイドバー設定の保存
 * - フェーズ8: シンプルモードのチェック（有効なら即return）
 */
export function initSidebarIntegration() {
    if (appState.sidebarVisible) {
        if (elements.sidebar) elements.sidebar.classList.remove('hidden');
        if (elements.sidebarResizeHandle) elements.sidebarResizeHandle.classList.remove('hidden');
        if (elements.iconBar) elements.iconBar.style.width = 'var(--sidebar-width)';
    } else {
        if (elements.sidebar) elements.sidebar.classList.add('hidden');
        if (elements.sidebarResizeHandle) elements.sidebarResizeHandle.classList.add('hidden');
        if (elements.iconBar) elements.iconBar.style.width = '48px';
    }
    document.documentElement.style.setProperty('--sidebar-width', `${appState.sidebarWidth}px`);

    // サイドバー用ショートカットの登録
    registerShortcut(['Ctrl+E'], () => {
        focusSidebarTree();
    }, { category: 'Sidebar' });

    registerShortcut(['Ctrl+N'], () => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'INPUT' && activeEl.classList.contains('tree-input')) {
            return;
        }
        createItemGlobally(false);
    }, { category: 'Sidebar' });

    registerShortcut(['Ctrl+D'], () => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName === 'INPUT' && activeEl.classList.contains('tree-input')) {
            return;
        }
        createItemGlobally(true);
    }, { category: 'Sidebar' });

    initSidebar();
}
