import { darken, lighten } from '../utils/color'

interface BeadGlyphProps {
  color: string
  r: number
  /** 渐变 id，需在页面内唯一，避免不同珠子互相覆盖 */
  gradientId: string
  gloss?: 'high' | 'matte' | 'metallic'
}

/**
 * 单颗珠子的立体渲染：径向渐变 + 左上高光 + 深色描边。
 * 以 (0,0) 为圆心，配合外层 <g transform> 平移定位。
 */
export default function BeadGlyph({ color, r, gradientId, gloss = 'high' }: BeadGlyphProps) {
  // 不同光泽度的明暗与高光参数
  const highlight =
    gloss === 'matte'
      ? { light: 0.3, dark: 0.35, spot: 0.35 }
      : gloss === 'metallic'
        ? { light: 0.7, dark: 0.55, spot: 0.7 }
        : { light: 0.5, dark: 0.4, spot: 0.6 }

  return (
    <g>
      <defs>
        <radialGradient id={gradientId} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor={lighten(color, highlight.light)} />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor={darken(color, highlight.dark)} />
        </radialGradient>
      </defs>
      {/* 珠体 */}
      <circle r={r} fill={`url(#${gradientId})`} stroke={darken(color, 0.55)} strokeWidth={r * 0.06} />
      {/* 左上高光点 */}
      <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.22} fill="#ffffff" opacity={highlight.spot} />
    </g>
  )
}
