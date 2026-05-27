import { defineConfig } from 'vitest/config';

// 物理・衝突は純粋関数なので node 環境で十分 (DOM 不要)。
// DOM 依存のテストが必要になったら environment を jsdom に切替える。
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    passWithNoTests: true,
  },
});
