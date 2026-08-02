// 将来の多言語化（i18n）に向けた準備用ファイル
// UI上で表示する日本語テキストをここに集約し、main.jsからは t('キー名') で呼び出すようにする。

const DICT = {
    ja: {
        // 例: エラーメッセージなど、新しく追加する文字列をここに追記していく
        folder: {
            delete: {
                error_not_empty_title: "フォルダ削除エラー",
                error_not_empty_msg: "このフォルダは空ではないため削除できません。\nエクスプローラでフォルダを開いて中身を確認しますか？",
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
