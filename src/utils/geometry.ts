export interface Point {
  x: number
  y: number
}

/**
 * 将 count 颗珠子沿圆形均匀分布，返回每颗珠子的圆心坐标。
 * 角度从顶部（-90°）开始，顺时针排列。
 */
export function beadPositions(count: number, cx: number, cy: number, radius: number): Point[] {
  if (count === 0) return []
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })
}

/**
 * 根据手串半径和珠子数量计算单颗珠子半径。
 * 以「满编 10 颗」为上限：10 颗时珠子恰好首尾相接（无间隙），
 * 少于 10 颗保持该满尺寸（间隙自然变大），超过 10 颗则缩小半径以挤下下一颗。
 * 相邻珠子圆心连成弦，半径取弦长一半，保证恰好相切、无重叠无间隙。
 */
export function beadRadius(count: number, braceletRadius: number): number {
  if (count === 0) return braceletRadius * 0.2
  const FULL_COUNT = 10
  const effectiveCount = Math.max(count, FULL_COUNT)
  const radius = braceletRadius * Math.sin(Math.PI / effectiveCount)
  return Math.max(4, radius)
}
