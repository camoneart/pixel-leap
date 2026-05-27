import { defineConfig } from 'vite';

// 依存最小・Canvas 2D の単一画面アプリ。ビルドターゲットは tsconfig と揃える。
export default defineConfig({
  root: '.',
  build: {
    target: 'es2022',
  },
});
