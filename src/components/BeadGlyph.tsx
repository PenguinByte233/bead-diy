import { darken, lighten } from '../utils/color'
import type { ImageFit } from '../types'

interface BeadGlyphProps {
  color?: string
  image?: string
  /** 实拍图拟合参数：把主体（珠子）缩放到半径 r，去掉透明留白 */
  imageFit?: ImageFit
  r: number
  /** 渐变/裁剪 id，需在页面内唯一，避免不同珠子互相覆盖 */
  gradientId: string
  gloss?: 'high' | 'matte' | 'metallic'
}

/**
 * 单颗珠子的渲染。有实拍图时用图片（圆形裁剪 + 细描边），
 * 否则回退到 SVG 径向渐变 + 高光。以 (0,0) 为圆心，配合外层 <g transform> 平移定位。
 */
export default function BeadGlyph({ color, image, imageFit, r, gradientId, gloss = 'high' }: BeadGlyphProps) {
  // 实拍图：透明底 PNG 裁剪成圆形。有拟合参数时按主体中心与半径缩放，
  // 让珠子填满槽位（无透明留白）；否则回退到「铺满裁圆」。
  if (image) {
    const clipId = `${gradientId}-clip`
    const shadowId = `${gradientId}-shadow`
    const s = imageFit ? r / imageFit.r : null
    const rect = s
      ? { x: -imageFit!.cx * s, y: -imageFit!.cy * s, w: imageFit!.w * s, h: imageFit!.h * s }
      : null
    return (
      <g filter={`url(#${shadowId})`}>
        <defs>
          <clipPath id={clipId}>
            <circle r={r} />
          </clipPath>
          <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy={r * 0.1}
              stdDeviation={r * 0.08}
              floodColor="#000000"
              floodOpacity="0.28"
            />
          </filter>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {rect ? (
            <image href={image} x={rect.x} y={rect.y} width={rect.w} height={rect.h} />
          ) : (
            <image
              href={image}
              x={-r}
              y={-r}
              width={r * 2}
              height={r * 2}
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </g>
      </g>
    )
  }

  // 兜底：SVG 渐变模拟立体感
  const c = color ?? '#cccccc'
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
          <stop offset="0%" stopColor={lighten(c, highlight.light)} />
          <stop offset="35%" stopColor={c} />
          <stop offset="100%" stopColor={darken(c, highlight.dark)} />
        </radialGradient>
      </defs>
      {/* 珠体 */}
      <circle r={r} fill={`url(#${gradientId})`} stroke={darken(c, 0.55)} strokeWidth={r * 0.06} />
      {/* 左上高光点 */}
      <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.22} fill="#ffffff" opacity={highlight.spot} />
    </g>
  )
}
