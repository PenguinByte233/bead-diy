import { layoutBeads, type Point } from '../utils/geometry'

// 3D 场景统一使用世界单位：手串半径 R = 1，正交相机按此取景。
export const R = 1

// 正交相机取景半宽（覆盖满编珠子的最外缘 + 阴影余量）
export const CAMERA_HALF = 1.6

/** 一串珠子在 3D 世界坐标下的布局（圆心在原点），复用 layoutBeads。 */
export function beadWorldLayout(diameters: (number | undefined)[]): {
  positions: Point[]
  radii: number[]
  fullness: number
} {
  return layoutBeads(diameters, 0, 0, R)
}
