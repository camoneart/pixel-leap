// 共有ドメイン型 (Canvas/DOM 非依存)。物理・衝突の純粋関数はこれらの型のみに依存する。

/** 2D ベクトル */
export interface Vec2 {
  x: number;
  y: number;
}

/** 軸平行矩形 (左上原点、y は下向きが正) */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** プレイヤー状態 (矩形 + 速度 + 接地フラグ) */
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 横速度 (px/sec) 右が正 */
  vx: number;
  /** 縦速度 (px/sec) 下が正 */
  vy: number;
  /** 接地中か (ジャンプ可否判定に使う) */
  onGround: boolean;
}

/** 地形プラットフォーム (床・段差) は矩形そのもの */
export type Platform = Rect;

/** 1 フレームの入力スナップショット */
export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

/** 物理定数 */
export interface PhysicsConfig {
  /** 重力加速度 (px/sec^2) 下向きが正 */
  gravity: number;
  /** 左右移動速度 (px/sec) */
  moveSpeed: number;
  /** ジャンプ初速 (px/sec) 上向きの大きさ。実装では vy = -jumpSpeed */
  jumpSpeed: number;
}

/** ゲーム全体の状態 */
export interface GameState {
  player: Player;
  platforms: Platform[];
  width: number;
  height: number;
}
