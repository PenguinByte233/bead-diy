import { darken, lighten } from '../utils/color'
import type { RopeType } from '../types'

interface RopeRingProps {
  rope: RopeType
  /** 绳环半径（圆心在 0,0，由外层 <g transform> 平移定位） */
  radius: number
  /** 绳体粗细（直径） */
  thickness: number
  /** 渐变/图案/滤镜 id 前缀，页面内需唯一，避免不同绳环互相覆盖 */
  id: string
}

/**
 * 立体串绳渲染：模拟中国结那种「两股细绳交织」的编织质感。
 * 用 45° 斜纹图案填充绳环，表现两根绳绞在一起；再叠一层对角明暗渐变
 * 压出圆柱形立体感，边缘收形、底部加投影，接近真实绳子的观感。
 * 供手串主视图与素材区缩略图复用。
 */
export default function RopeRing({ rope, radius, thickness, id }: RopeRingProps) {
  const shadowId = `${id}-shadow`

  // 实拍绳环图：按拟合参数缩放到目标半径，环心对齐原点（配合外层 translate 定位）
  if (rope.image && rope.imageFit) {
    const { w, h, cx, cy, r } = rope.imageFit
    const s = radius / r
    return (
      <g>
        <defs>
          <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy={thickness * 0.25}
              stdDeviation={thickness * 0.3}
              floodColor="#000000"
              floodOpacity="0.25"
            />
          </filter>
        </defs>
        <g filter={`url(#${shadowId})`}>
          <image
            href={rope.image}
            x={-cx * s}
            y={-cy * s}
            width={w * s}
            height={h * s}
          />
        </g>
      </g>
    )
  }

  const c = rope.color ?? '#cccccc'
  const outer = radius + thickness / 2
  const inner = radius - thickness / 2

  const maskId = `${id}-mask`
  const braidId = `${id}-braid`
  const shadeId = `${id}-shade`

  // 两股色：主色压暗为一股，次色（或提亮）为另一股，交织出编织感
  const base = darken(c, 0.18)
  const strand = rope.color2 ?? lighten(c, 0.35)
  // 编织周期：随绳粗缩放，太疏或太密都不像真绳
  const period = Math.max(thickness * 1.9, 6)

  return (
    <g>
      <defs>
        {/* 斜纹编织图案：主色打底 + 另一股色半幅，45° 旋转后沿圆周绞合 */}
        <pattern
          id={braidId}
          width={period}
          height={period}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={period} height={period} fill={base} />
          <rect width={period / 2} height={period} fill={strand} />
        </pattern>
        {/* 对角明暗：左上受光、右下阴影，压出圆柱立体感 */}
        <linearGradient id={shadeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </linearGradient>
        {/* 环形遮罩：只保留绳体所在的圆环带 */}
        <mask id={maskId}>
          <circle r={outer} fill="#ffffff" />
          <circle r={inner} fill="#000000" />
        </mask>
        <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy={thickness * 0.25}
            stdDeviation={thickness * 0.3}
            floodColor="#000000"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        {rope.kind === 'leather' ? (
          <>
            {/* 皮革绳：平滑绳体 + 明暗 + 内缘一道高光 */}
            <circle r={outer} fill={c} mask={`url(#${maskId})`} />
            <circle r={outer} fill={`url(#${shadeId})`} mask={`url(#${maskId})`} />
            <circle
              r={inner + thickness * 0.26}
              fill="none"
              stroke={lighten(c, 0.3)}
              strokeWidth={thickness * 0.16}
              opacity="0.55"
              mask={`url(#${maskId})`}
            />
          </>
        ) : (
          <>
            {/* 两股编织纹理 */}
            <circle r={outer} fill={`url(#${braidId})`} mask={`url(#${maskId})`} />
            {/* 整体圆柱明暗，压出立体感 */}
            <circle r={outer} fill={`url(#${shadeId})`} mask={`url(#${maskId})`} />
            {/* 内外边缘收形，让绳体轮廓更清晰 */}
            <circle
              r={outer - 0.6}
              fill="none"
              stroke={darken(c, 0.45)}
              strokeWidth={1.1}
              opacity="0.45"
            />
            <circle
              r={inner + 0.6}
              fill="none"
              stroke={darken(c, 0.45)}
              strokeWidth={1.1}
              opacity="0.3"
            />
          </>
        )}
      </g>
    </g>
  )
}
