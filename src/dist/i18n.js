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
        }
    }
};

let currentLang = 'ja';

window.t = function(key, params = {}) {
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
