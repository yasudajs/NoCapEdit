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
            }
        }
    }
};

let currentLang = 'ja';

window.t = function(key) {
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
    return typeof current === 'string' ? current : key;
};
