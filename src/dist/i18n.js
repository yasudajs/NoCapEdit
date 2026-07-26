// NoCapEdit 多言語化（i18n）辞書・翻訳関数
// UI上で表示するテキストをここに集約し、各JSからは t('キー名') で呼び出す。

const DICT = {
    ja: {
        // ── ツールチップ ──
        'tooltip.explorer': 'エクスプローラ',
        'tooltip.new_tab': '新規タブを作成',
        'tooltip.settings': '設定',
        'tooltip.change_font': 'フォントを変更',
        'tooltip.change_tab_behavior': 'Tabキーの挙動を変更',
        'tooltip.change_save_mode': '保存モードを変更',
        'tooltip.change_char_count': '文字数カウント方法を変更',
        'tooltip.change_theme': 'テーマを変更',
        'tooltip.change_mode': '動作モードを変更',

        // ── エディタ ──
        'editor.placeholder': '入力準備完了',

        // ── ステータスバー ──
        'status.initializing': '準備中...',
        'status.ready_auto': '保存準備完了',
        'status.ready_manual': '※Ctrl+Sで保存できます',
        'status.editing': '編集中',
        'status.saving': '保存中...',
        'status.saved': '保存済み',
        'status.save_failed': '保存失敗',
        'status.saved_as': '別名で保存済み',
        'status.renamed': '{name} に名前変更されました',
        'status.file_created': '{name} を作成',
        'status.file_opened': '{name} を開きました',
        'status.loading_file': 'ファイルを読み込み中...',
        'status.loading_fonts': 'システムフォントを読み込み中...',
        'status.aborted': '処理を中止しました',
        'status.manual_mode_prefix': '[手動保存モード] {message}',
        'status.manual_save_prefix': '[手動保存:Ctrl+S] ',
        'status.error_init': '初期化エラー',
        'status.error_exit': '終了処理失敗',
        'status.error_no_home_folder': 'ホームフォルダ未設定',
        'status.error_create_new_file': '新規ファイル作成失敗',
        'status.error_switch_tab': 'タブ切替失敗',
        'status.error_save_settings': '設定保存エラー',
        'status.error_save_dialog_unavailable': '別名保存ダイアログを利用できません',
        'status.error_delete_empty_file': '空ファイル削除失敗',
        'status.error_load_file': 'ファイル読み込み失敗',
        'status.error_load_fonts': 'フォント読み込み失敗',

        // ── タブ ──
        'tab.unsaved': '未保存',
        'tab.unsaved_prefix': '[未保存',
        'tab.unsaved_label': '未保存{num}',
        'tab.unsaved_title': '[未保存{num}] {name}',

        // ── 設定ダイアログ ──
        'settings.dialog_title': 'NoCapEdit - 設定',
        'settings.update_available': 'アップデート可能です:',
        'settings.open_release_notes': 'リリースノートを開く',
        'settings.home_folder_label': 'ホームフォルダ:',
        'settings.button_browse': '参照...',
        'settings.hint_folder_missing': '保存先フォルダが見つからないため、再設定してください',
        'settings.hint_folder_default': 'ここにファイルが保存されます',
        'settings.font_label': 'フォント:',
        'settings.font_default': 'デフォルト (Monospace)',
        'settings.font_group_mono': '等幅フォント',
        'settings.font_group_other': 'その他のフォント',
        'settings.tab_behavior_label': 'Tabキーの挙動:',
        'settings.tab_char': 'タブ文字 (\\t)',
        'settings.space2': 'スペース 2文字',
        'settings.space4': 'スペース 4文字',
        'settings.save_mode_label': '保存モード:',
        'settings.save_auto': '自動保存（推奨）',
        'settings.save_manual': '手動保存(Ctrl+Sで保存)',
        'settings.char_count_label': '文字数カウント:',
        'settings.char_count_with_newline': '改行を含む（デフォルト）',
        'settings.char_count_no_newline': '文字数のみ（改行を除く）',
        'settings.theme_label': 'テーマ:',
        'settings.theme_dark': 'ダーク',
        'settings.theme_soft_dark': 'ソフトダーク',
        'settings.theme_light': 'ライト',
        'settings.mode_label': '動作モード:',
        'settings.mode_full': 'フルモード',
        'settings.mode_simple': 'シンプルモード',

        // ── ダイアログ共通 ──
        'dialog.error_title': 'エラー',
        'dialog.confirm_title': '確認',
        'dialog.warning_title': '警告',
        'dialog.button.retry': '再試行',
        'dialog.button.save_as': '別名で保存',
        'dialog.button.cancel': 'キャンセル',
        'dialog.retry_or_cancel': '{message}\n\n[OK]でリトライ、[キャンセル]で中止',
        'dialog.save_failed_detail': '保存に失敗しました。\n対象: {name}\n理由: {error}',

        // ── アラート ──
        'alert.home_folder_required': 'ホームフォルダを指定してください',

        // ── コンテキストメニュー ──
        'context_menu.new_file': '新規ファイル作成',
        'context_menu.new_folder': '新規フォルダ作成',
        'context_menu.rename': '名前を変更',
        'context_menu.delete': '削除',

        // ── サイドバー: ヘッダー ──
        'sidebar.header_file': 'ファイル',

        // ── サイドバー: ツリー表示 ──
        'sidebar.loading': '読み込み中...',
        'sidebar.folder_empty': 'フォルダは空です',
        'sidebar.tree_error': '読み込みエラー: {error}',

        // ── サイドバー: D&D / 移動 ──
        'sidebar.error_move_to_self': '自分自身またはサブフォルダへは移動できません',
        'sidebar.moving': '移動中...',
        'sidebar.moved_to_root': 'ルートへ移動しました',
        'sidebar.moved_to': '{source} を {target} へ移動しました',
        'sidebar.moved': '移動しました',
        'sidebar.moved_to_folder': '{target} へ移動しました',
        'sidebar.move_completed': '移動が完了しました',
        'sidebar.error_move': '移動に失敗しました: {error}',

        // ── サイドバー: コピー / 切り取り / 貼り付け ──
        'sidebar.error_copy_to_self': '自分自身またはサブフォルダへはコピーできません',
        'sidebar.copied': '{name} をコピーしました',
        'sidebar.cut': '{name} を切り取りました',
        'sidebar.no_clipboard': 'コピーまたは切り取りされたファイル/フォルダがありません',
        'sidebar.pasting': '貼り付け中...',
        'sidebar.pasted_to_root': 'コピーしました',
        'sidebar.pasted_to': '{target} へコピーしました',
        'sidebar.paste_completed': '貼り付けが完了しました',
        'sidebar.error_copy': 'コピーに失敗しました: {error}',

        // ── サイドバー: 新規作成 / 名前変更 ──
        'sidebar.default_folder_name': '新しいフォルダ',
        'sidebar.default_file_name': '名称未設定',
        'sidebar.error_create': '作成に失敗しました: {error}',
        'sidebar.error_rename': '名前変更に失敗しました: {error}',

        // ── サイドバー: 削除 ──
        'sidebar.confirm_trash': '「{name}」を削除してごみ箱に移動しますか？',
        'sidebar.confirm_permanent_delete': '「{name}」をごみ箱に入れず、完全に削除しますか？\n※この操作は取り消せません。',
        'sidebar.permanently_deleted': '完全に削除しました',
        'sidebar.error_delete': '削除に失敗しました: {error}',
        'sidebar.error_folder_not_empty_title': 'フォルダ削除エラー',
        'sidebar.error_folder_not_empty_msg': 'このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？',

        // ── 旧キー名（互換用エイリアス：フェーズ3で呼び出し側を更新後に削除予定） ──
        'status_ready_auto': '保存準備完了',
        'status_ready_manual': '※Ctrl+Sで保存できます',
        'folder_delete_error_not_empty_title': 'フォルダ削除エラー',
        'folder_delete_error_not_empty_msg': 'このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？',
    },
    en: {
        // 将来の英語対応用（現時点では空）
    }
};

let currentLang = 'ja';

/**
 * 翻訳関数: キー名に対応するテキストを返す。
 * テンプレート変数（{name} 形式）がある場合は params で置換する。
 * @param {string} key - 辞書のキー名
 * @param {Object} [params={}] - テンプレート変数の置換マップ
 * @returns {string} 翻訳テキスト（キーが見つからない場合はキー名をそのまま返す）
 */
window.t = function(key, params = {}) {
    let text = (DICT[currentLang] && DICT[currentLang][key]) ? DICT[currentLang][key] : key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, v);
    }
    return text;
};

/**
 * HTML要素の data-i18n 属性に基づいてテキストを一括置換する。
 * - data-i18n: 要素の textContent を置換
 * - data-i18n-title: 要素の title 属性を置換
 * - data-i18n-placeholder: 要素の placeholder 属性を置換
 */
window.applyTranslations = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
};
