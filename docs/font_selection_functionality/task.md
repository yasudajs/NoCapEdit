# タスクリスト: フォント変更機能の実装

- [x] 依存関係の追加
  - [x] Cargo.toml に fontdb を追加
- [x] バックエンド (Rust) の実装
  - [x] AppSettings および SettingsResponse への font_family フィールドの追加
  - [x] default_font_family() 関数の定義
  - [x] get_settings および save_settings の修正
  - [x] get_system_fonts コマンドの実装
  - [x] main() 内のハンドラーに get_system_fonts を登録
- [x] フロントエンドの実装
  - [x] index.html へのフォント選択用 select 要素の追加
  - [x] style.css へのフォント選択ドロップダウンのスタイル追加
  - [x] main.js でのアプリ状態 (appState) に fontFamily を追加
  - [x] main.js での get_system_fonts の呼び出しとドロップダウンの動的構築
  - [x] main.js でのフォント設定の適用・変更イベント・保存処理の実装
- [x] 検証
  - [x] ビルドとテストの実行
  - [x] 動作確認（フォントの切り替え、永続化、テーマ切り替え時の表示確認）
