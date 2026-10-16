import { beadPositions, type Point } from '../utils/geometry'

// 3D 场景统一使用世界单位：手串半径 R = 1，正交相机按此取景。
export const R = 1

// 珠子间距系数：让相邻珠子之间留出可见缝隙，绳子才能从珠间自然显露。
// 相切时为 1，越小缝隙越大、绳子越明显。阶段一先取 0.85 验证遮挡效果。
export const BEAD_SPACING = 0.85

// 正交相机取景半宽（覆盖 10 颗满编珠子的最外缘 + 阴影余量）
export const CAMERA_HALF = 1.6

/** 珠子圆心位置（世界坐标，圆心在原点），复用现有圆形排列算法。 */
export function beadWorldPositions(count: number): Point[] {
  return beadPositions(count, 0, 0, R)
}

/** 单颗珠子半径（世界单位）。满编 10 颗为上限，乘 spacing 留出绳缝。 */
export function beadWorldRadius(count: number): number {
  if (count <= 0) return R * 0.2
  const FULL_COUNT = 10
  const n = Math.max(count, FULL_COUNT)
  return R * Math.sin(Math.PI / n) * BEAD_SPACING
}
