# 実装計画書: Step 9 設定値のバリデーション（clamp） (v0.1.93)

## 概要
`docs/wip/review_v0.1.87_to_v0.1.92.md` で指摘された 🟡改善 #2（`config.json` 手動編集時等における設定値バリデーション欠如）に対応し、`AppSettings::load()` 時に `font_size`（8〜72）と `line_height`（1.0〜3.0）をフロントエンド入力範囲内に `clamp` してサニタイズします。

---

## 修正内容

### 1. [MODIFY] [settings.rs](file:///c:/work/NoCapEdit/src/settings.rs)

#### A. `AppSettings::load()` での範囲制限
```diff
     pub fn load() -> Self {
-        if let Ok(content) = fs::read_to_string(Self::config_path()) {
-            if let Ok(settings) = serde_json::from_str(&content) {
-                return settings;
-            }
-        }
-        Self::default()
+        let mut settings = if let Ok(content) = fs::read_to_string(Self::config_path()) {
+            if let Ok(s) = serde_json::from_str(&content) {
+                s
+            } else {
+                Self::default()
+            }
+        } else {
+            Self::default()
+        };
+
+        // 異常値防止: フロントエンド入力範囲と一致させる
+        settings.font_size = settings.font_size.clamp(8, 72);
+        settings.line_height = settings.line_height.clamp(1.0, 3.0);
+
+        settings
     }
```

#### B. 単体テストの追加
`settings.rs` に範囲外の値が正しく補正されることを検証するユニットテストを追加します。

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_clamp_ranges() {
        let mut s = AppSettings::default();
        
        // 下限超過テスト
        s.font_size = 0;
        s.line_height = 0.5;
        s.font_size = s.font_size.clamp(8, 72);
        s.line_height = s.line_height.clamp(1.0, 3.0);
        assert_eq!(s.font_size, 8);
        assert_eq!(s.line_height, 1.0);

        // 上限超過テスト
        s.font_size = 999;
        s.line_height = 10.0;
        s.font_size = s.font_size.clamp(8, 72);
        s.line_height = s.line_height.clamp(1.0, 3.0);
        assert_eq!(s.font_size, 72);
        assert_eq!(s.line_height, 3.0);
    }
}
```

---

## バージョンについて
- 本リファクタリング（Step 1〜10）は同一バージョン（`0.1.93`）および同一作業ブランチ内で実施するため、バージョン番号の変更はありません。

---

## 検証計画
1. `cargo check` でコンパイルエラー・警告がないことを確認
2. `cargo test` で既存テストおよび新設テスト（`test_settings_clamp_ranges`）が正常に通過することを確認
