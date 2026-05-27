// 地形生成。1 画面分の床 + 段差プラットフォーム (2-3 個) を返す。
import type { Platform } from './types';

/**
 * 1 画面分の地形を生成する (床 + 段差プラットフォーム 3 個)。
 * 段差の高低差はデフォルト物理 (gravity/jumpSpeed) のジャンプ到達高 (約 105px) 内に収める。
 * @param width 画面幅 (px)
 * @param height 画面高さ (px)
 * @returns プラットフォーム矩形の配列 (先頭が床)
 */
export function createTerrain(width: number, height: number): Platform[] {
  const floorThickness = 40;
  const floor: Platform = {
    x: 0,
    y: height - floorThickness,
    width,
    height: floorThickness,
  };

  const stepThickness = 18;
  const step1: Platform = { x: 140, y: height - 120, width: 120, height: stepThickness };
  const step2: Platform = { x: 340, y: height - 190, width: 120, height: stepThickness };
  const step3: Platform = { x: 560, y: height - 260, width: 140, height: stepThickness };

  return [floor, step1, step2, step3];
}
