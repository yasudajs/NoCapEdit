import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // ソースディレクトリ
  root: './src/frontend',

  // 開発サーバー設定
  server: {
    port: 1420,
    strictPort: true,
  },

  // ビルド設定
  build: {
    // 出力先（root からの相対パス → src/frontend/../dist = src/dist）
    outDir: '../dist',
    emptyOutDir: true,
    // ソースマップ（開発時のデバッグ用）
    sourcemap: true,
    // マルチページ対応（help.html を含める）
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/frontend/index.html'),
        help: resolve(__dirname, 'src/frontend/help.html'),
      },
    },
  },

  // 静的アセットのベースパス
  base: './',
});
