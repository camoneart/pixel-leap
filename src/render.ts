// 描画 (DOM 依存)。状態を読み取り Canvas に矩形を描くだけ。見た目の作り込みは範囲外。
import type { GameState } from './types';

/**
 * ゲーム状態を Canvas に矩形描画する (背景 -> 地形 -> プレイヤー)。
 */
export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width, height, platforms, player } = state;

  // 背景
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, width, height);

  // 地形 (先頭=床も含め同色の矩形)
  ctx.fillStyle = '#3a4252';
  for (const p of platforms) {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }

  // プレイヤー
  ctx.fillStyle = '#ffcc4d';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}
