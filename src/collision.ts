// AABB 衝突 (純粋関数群)。Canvas/DOM 非依存。引数は不変、結果は新しい値を返す。
import type { Platform, Player, Rect } from './types';

/**
 * 2 矩形が AABB 交差しているか (純粋関数)。境界がちょうど接するだけ (隙間 0) は非交差扱い。
 */
export function aabbIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** プレイヤーの水平範囲が矩形と重なるか (隙間 0 接触は非重複)。 */
function overlapsHorizontally(player: Player, plat: Platform): boolean {
  return player.x < plat.x + plat.width && player.x + player.width > plat.x;
}

/**
 * 移動後プレイヤーと地形群の衝突を解決する (純粋関数)。
 * - 落下中 (vy > 0) に天面へ着地: y を天面に合わせ vy=0, onGround=true
 * - 上昇中 (vy < 0) に底面へ衝突: y を底面の下へ戻し vy=0 (頭ぶつけは接地しない)
 * - prevPlayer (移動前位置) を用いたスイープ判定で高速移動時の貫通 (tunneling) を防ぐ
 * @param player 移動後 (積分後) のプレイヤー
 * @param platforms 地形矩形群
 * @param prevPlayer 移動前のプレイヤー (スイープ判定の基準)
 * @returns 衝突解決後の新しい Player (引数は不変)
 */
export function resolveCollisions(
  player: Player,
  platforms: readonly Platform[],
  prevPlayer: Player,
): Player {
  const result: Player = { ...player };

  if (player.vy > 0) {
    // 落下中: 移動前の足元が天面より上にあり、移動後に天面を越えた天面へ着地する。
    // 複数候補があれば最初に当たる「最も上の天面 (最小 top)」を選ぶ (配列順非依存)。
    const prevBottom = prevPlayer.y + prevPlayer.height;
    const movedBottom = player.y + player.height;
    let bestTop = Infinity;

    for (const plat of platforms) {
      if (!overlapsHorizontally(player, plat)) continue;
      const top = plat.y;
      if (prevBottom <= top && movedBottom >= top && top < bestTop) {
        bestTop = top;
      }
    }

    if (bestTop !== Infinity) {
      result.y = bestTop - player.height;
      result.vy = 0;
      result.onGround = true;
    }
  } else if (player.vy < 0) {
    // 上昇中: 移動前の頭が底面より下にあり、移動後に底面を越えた底面で止める。
    // 複数候補があれば最初に当たる「最も下の底面 (最大 bottom)」を選ぶ。
    const prevTop = prevPlayer.y;
    const movedTop = player.y;
    let bestBottom = -Infinity;

    for (const plat of platforms) {
      if (!overlapsHorizontally(player, plat)) continue;
      const bottom = plat.y + plat.height;
      if (prevTop >= bottom && movedTop <= bottom && bottom > bestBottom) {
        bestBottom = bottom;
      }
    }

    if (bestBottom !== -Infinity) {
      result.y = bestBottom;
      result.vy = 0;
    }
  }

  return result;
}
