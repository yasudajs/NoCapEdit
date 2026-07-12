// 将来の多言語化（i18n）に向けた準備用ファイル
// UI上で表示する日本語テキストをここに集約し、main.jsからは t('キー名') で呼び出すようにする。

const DICT = {
    ja: {
        // 例: エラーメッセージなど、新しく追加する文字列をここに追記していく
        // status_api_error: "Tauri API 初期化失敗",
    }
};

let currentLang = 'ja';

window.t = function(key) {
    if (DICT[currentLang] && DICT[currentLang][key]) {
        return DICT[currentLang][key];
    }
    // 開発中のデバッグ用に、キーが見つからない場合はそのままキー名を出力する
    return key;
};
