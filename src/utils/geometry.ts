export interface Point {
  x: number
  y: number
}

// 珠子直径（mm）→ 满编无间隙颗数。手串半径固定时，直径越小一圈能放下的颗数越多。
export const BEAD_DIAMETERS = [6, 8, 10] as const
export const DEFAULT_BEAD_DIAMETER = 10
export const FULL_COUNT_BY_DIAMETER: Record<number, number> = {
  6: 28,
  8: 22,
  10: 18,
}

/** 由珠子直径取满编无间隙颗数；未知直径回退到默认直径。 */
export function fullCountForDiameter(diameter?: number): number {
  return (
    FULL_COUNT_BY_DIAMETER[diameter ?? DEFAULT_BEAD_DIAMETER] ??
    FULL_COUNT_BY_DIAMETER[DEFAULT_BEAD_DIAMETER]
  )
}

/**
 * 一串珠子的「占用率」：每颗直径 d 的珠子占圆周的比例为 1/满编数(d)，求和即整串占用率。
 * 满编 = 占用率之和等于 1。用于判断是否还能再塞下珠子。
 */
export function braceletFullness(diameters: (number | undefined)[]): number {
  return diameters.reduce((sum: number, d) => sum + 1 / fullCountForDiameter(d), 0)
}

/**
 * 沿圆布置一串珠子，返回每颗珠子的圆心坐标、半径与整串占用率。
 *
 * 每颗珠子的半角 α_i = π / 满编数(d_i)，半径 r_i = radius · sin(α_i)。
 * 全部同直径时退化为等角度均分；混用直径时保证相邻珠子恰好相切、无重叠无间隙。
 * 剩余间隙（2π - 2Σα_i）均分到相邻珠子之间；若占用率 > 1（旧保存数据超编兜底），
 * 则全体 α_i 按占用率压缩到恰好一圈。
 */
export function layoutBeads(
  diameters: (number | undefined)[],
  cx: number,
  cy: number,
  radius: number,
): { positions: Point[]; radii: number[]; fullness: number } {
  const n = diameters.length
  if (n === 0) return { positions: [], radii: [], fullness: 0 }

  let alphas = diameters.map((d) => Math.PI / fullCountForDiameter(d))
  const fullness = alphas.reduce((s, a) => s + a, 0) / Math.PI
  if (fullness > 1) {
    alphas = alphas.map((a) => a / fullness)
  }

  const occupied = 2 * alphas.reduce((s, a) => s + a, 0)
  const gapPerPair = Math.max(0, 2 * Math.PI - occupied) / n

  const positions: Point[] = []
  const radii: number[] = []
  let theta = -Math.PI / 2 // 从顶部开始，顺时针排列
  for (let i = 0; i < n; i++) {
    positions.push({ x: cx + radius * Math.cos(theta), y: cy + radius * Math.sin(theta) })
    radii.push(radius * Math.sin(alphas[i]))
    theta += alphas[i] + alphas[(i + 1) % n] + gapPerPair
  }
  return { positions, radii, fullness }
}
