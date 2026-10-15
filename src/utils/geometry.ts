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
 * 根据手串半径和珠子数量计算单颗珠子半径，使相邻珠子不重叠。
 * 数量越多珠子越小，并限制上下限避免过大或过小。
 */
export function beadRadius(count: number, braceletRadius: number, gapFactor = 0.95): number {
  if (count === 0) return braceletRadius * 0.2
  const arcLength = (2 * Math.PI * braceletRadius) / count
  const radius = (arcLength / 2) * gapFactor
  return Math.max(4, Math.min(radius, braceletRadius * 0.24))
}
