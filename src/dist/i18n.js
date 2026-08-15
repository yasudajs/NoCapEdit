// 将来の多言語化（i18n）に向けた準備用ファイル
// UI上で表示する日本語テキストをここに集約し、main.jsからは t('キー名') で呼び出すようにする。

const DICT = {
    ja: {
        // 例: エラーメッセージなど、新しく追加する文字列をここに追記していく
        folder: {
            delete: {
                error: {
                    not_empty: {
                        title: "フォルダ削除エラー",
                        msg: "このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？"
                    }
                }
            }
        },
        main: {
            error: {
                exitFailed: "終了処理失敗",
                initFailed: "初期化エラー: {error}"
            }
        },
        settings: {
            folder: {
                hint: {
                    missing: "保存先フォルダが見つからないため、再設定してください",
                    default: "ここにファイルが保存されます"
                }
            },
            alert: {
                home: {
                    folder: {
                        required: "ホームフォルダを指定してください"
                    }
                }
            },
            font: {
                group: {
                    monospace: "等幅フォント",
                    other: "その他のフォント"
                }
            }
        },
        status: {
            initializing: "準備中...",
            ready: "準備完了",
            loading: {
                fonts: "システムフォントを読み込み中..."
            },
            error: {
                settings: {
                    save: "設定保存エラー"
                },
                font: {
                    load: "フォント読み込み失敗"
                }
            }
        },
        tabs: {
            unsaved: {
                label: "未保存"
            },
            state: {
                saving: "保存中...",
                editing: "編集中",
                saved: "保存済み"
            },
            status: {
                manualSaveHint: "※Ctrl+Sで保存できます",
                ready: "保存準備完了",
                manualSavePrefix: "[手動保存:Ctrl+S] ",
                manualModePrefix: "[手動保存モード] "
            },
            error: {
                noHomeFolder: "ホームフォルダ未設定",
                createFailed: "新規ファイル作成失敗",
                switchFailed: "タブ切替失敗"
            }
        },
        editor: {
            placeholder: "入力準備完了",
            metrics: {
                position: "{line}行, {col}列",
                selection: "{selected} / {total} 文字",
                length: "{total} 文字",
                font: "フォント {size} pt",
                lh: "行間 x {lh}"
            }
        },
        fs: {
            error: {
                noSaveDialog: "別名保存ダイアログを利用できません",
                deleteEmptyFile: "空ファイル削除失敗",
                maxLimitReached: "同名ファイル回避の上限に達しました",
                invalidPath: "保存先パスが不正です"
            },
            status: {
                saving: "保存中...",
                saved: "保存済み",
                savedAs: "別名で保存済み",
                saveFailed: "保存失敗",
                aborted: "処理を中止しました",
                created: "{prefix}{fileName} を作成",
                loading: "ファイルを読み込み中...",
                opened: "{fileName} を開きました",
                loadFailed: "ファイル読み込み失敗"
            },
            dialog: {
                saveError: "保存に失敗しました。\n対象: {fileName}\n理由: {error}"
            }
        },
        help: {
            title: "ショートカット一覧",
            categories: {
                edit: "テキスト編集",
                file: "ファイル・タブ操作",
                view: "表示・ズーム",
                other: "その他"
            },
            shortcuts: {
                moveLine: "行の上下移動",
                duplicateLine: "行の上下複製",
                deleteLine: "行の削除",
                insertTimestamp: "現在日時の挿入",
                indent: "インデント挿入",
                unindent: "インデント削除",
                save: "手動保存",
                newTab: "新規タブ追加",
                closeTab: "タブを閉じる",
                openExplorer: "エクスプローラーを開く",
                switchTab: "次のタブへ切り替え",
                switchTabPrev: "前のタブへ切り替え",
                zoomIn: "ズームイン (拡大)",
                zoomOut: "ズームアウト (縮小)",
                lineHeightInc: "行間を広げる",
                lineHeightDec: "行間を狭める",
                exitApp: "アプリを終了",
                closeHelp: "ヘルプを閉じる"
            }
        },
        ui: {
            tooltip: {
                addTab: "新規タブを作成",
                settings: "設定",
                fontSelect: "フォントを変更",
                tabBehavior: "Tabキーの挙動を変更",
                saveMode: "保存モードを変更",
                charCount: "文字数カウント方法を変更",
                theme: "テーマを変更"
            },
            dialog: {
                settings: {
                    title: "NoCapEdit - 設定",
                    update: {
                        available: "アップデート可能です:",
                        releaseNotes: "リリースノートを開く"
                    },
                    folder: {
                        label: "ホームフォルダ:",
                        browse: "参照..."
                    },
                    font: {
                        label: "フォント:",
                        default: "デフォルト (Monospace)"
                    },
                    tabBehavior: {
                        label: "Tabキーの挙動:",
                        tab: "タブ文字 (\\t)",
                        space2: "スペース 2文字",
                        space4: "スペース 4文字"
                    },
                    saveMode: {
                        label: "保存モード:",
                        auto: "自動保存（推奨）",
                        manual: "手動保存(Ctrl+Sで保存)"
                    },
                    charCount: {
                        label: "文字数カウント:",
                        withNewline: "改行を含む（デフォルト）",
                        noNewline: "文字数のみ（改行を除く）"
                    },
                    theme: {
                        label: "テーマ:",
                        dark: "ダーク",
                        softDark: "ソフトダーク",
                        light: "ライト"
                    }
                },
                error: {
                    title: "エラー",
                    retry: "再試行",
                    saveAs: "別名で保存",
                    cancel: "キャンセル"
                }
            }
        }
    }
};

let currentLang = 'ja';

export function t(key, params = {}) {
    if (!key || typeof key !== 'string') return key;
    const keys = key.split('.');
    let current = DICT[currentLang];
    for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
            current = current[k];
        } else {
            return key;
        }
    }
    
    if (typeof current === 'string') {
        let result = current;
        for (const [k, v] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
        return result;
    }
    return key;
};

export function applyI18nToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const text = t(el.dataset.i18n);
        if (text) {
            // テキストノードのみを置換し、内部のタグ（spanやbrなど）を破壊しないように配慮
            // ここではシンプルに textContent を置換する。内部タグがある場合は注意
            el.textContent = text;
        }
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const text = t(el.dataset.i18nTitle);
        if (text) el.title = text;
    });
};
