// プレイヤー物理 (純粋関数群)。Canvas/DOM 非依存。引数は不変、結果は新しい値を返す。
import type { InputState, Player, PhysicsConfig } from './types';

/**
 * 重力を縦速度に適用する (純粋関数)。
 * vy' = vy + gravity * dt
 * @param vy 現在の縦速度 (px/sec)
 * @param gravity 重力加速度 (px/sec^2)
 * @param dt フレーム時間 (sec)
 * @returns 更新後の縦速度
 */
export function applyGravity(vy: number, gravity: number, dt: number): number {
  return vy + gravity * dt;
}

/**
 * 左右入力から横速度を決定する (純粋関数)。
 * 左のみ -> -moveSpeed / 右のみ -> +moveSpeed / 両押し or 無入力 -> 0
 * @returns 横速度 (px/sec)
 */
export function horizontalVelocity(input: InputState, moveSpeed: number): number {
  let v = 0;
  if (input.right) v += moveSpeed;
  if (input.left) v -= moveSpeed;
  return v;
}

/**
 * 接地時のみジャンプ初速を与える (純粋関数)。
 * onGround=true なら vy = -jumpSpeed, onGround=false にする。空中なら変化なし。
 * @returns 新しい Player (引数は不変)
 */
export function jump(player: Player, jumpSpeed: number): Player {
  if (!player.onGround) return { ...player };
  return { ...player, vy: -jumpSpeed, onGround: false };
}

/**
 * 速度を位置に積分する (純粋関数)。
 * x' = x + vx * dt, y' = y + vy * dt
 * @returns 新しい Player (引数は不変)
 */
export function integrate(player: Player, dt: number): Player {
  return {
    ...player,
    x: player.x + player.vx * dt,
    y: player.y + player.vy * dt,
  };
}

/**
 * 1 ステップ分の物理更新 (純粋関数、衝突解決は含まない)。
 * 横速度反映 -> ジャンプ反映 -> 重力 -> 位置積分 の順で適用する。衝突は collision に委譲。
 * @returns 新しい Player (引数は不変)
 */
export function stepPhysics(
  player: Player,
  input: InputState,
  config: PhysicsConfig,
  dt: number,
): Player {
  const vx = horizontalVelocity(input, config.moveSpeed);
  let next: Player = { ...player, vx };
  if (input.jump) {
    next = jump(next, config.jumpSpeed);
  }
  next = { ...next, vy: applyGravity(next.vy, config.gravity, dt) };
  return integrate(next, dt);
}
