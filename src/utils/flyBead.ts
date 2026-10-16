import type { BeadType } from '../types'

export interface ScreenPoint {
  x: number
  y: number
}

interface FlyOptions {
  duration?: number
  easing?: string
  startScale?: number
}

// 飞入动画默认参数：中段时长 + 平滑减速缓动，避免「突现 / 卡顿」感
const DEFAULT_DURATION = 420
const DEFAULT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DEFAULT_START_SCALE = 0.4

/**
 * 用 Web Animations API 生成一颗从起点平移到终点的珠子（DOM 覆盖层）。
 * 落到目标槽位后通过 onDone 把珠子真正加入手串。
 * 起点为素材区中珠子的实际位置，终点为手串上对应槽位的屏幕坐标。
 */
export function flyBead(
  bead: BeadType,
  from: ScreenPoint,
  to: ScreenPoint,
  screenDiameter: number,
  onDone: () => void,
  options: FlyOptions = {},
) {
  if (!bead.image) {
    onDone()
    return
  }
  const { duration = DEFAULT_DURATION, easing = DEFAULT_EASING, startScale = DEFAULT_START_SCALE } = options

  const fit = bead.imageFit
  const w = fit?.w ?? 200
  const h = fit?.h ?? 200
  const cx = fit?.cx ?? w / 2
  const cy = fit?.cy ?? h / 2
  const r = fit?.r ?? Math.min(w, h) / 2
  const s = screenDiameter / (2 * r)
  const ox = cx * s
  const oy = cy * s

  const img = document.createElement('img')
  img.src = bead.image
  img.alt = ''
  img.draggable = false
  img.style.position = 'fixed'
  img.style.left = '0'
  img.style.top = '0'
  img.style.width = `${w * s}px`
  img.style.height = `${h * s}px`
  img.style.pointerEvents = 'none'
  img.style.zIndex = '9999'
  img.style.willChange = 'transform'

  const start = `translate(${from.x - ox}px, ${from.y - oy}px) scale(${startScale})`
  const end = `translate(${to.x - ox}px, ${to.y - oy}px) scale(1)`
  img.style.transform = start
  document.body.appendChild(img)

  const anim = img.animate(
    [
      { transform: start, opacity: 1 },
      { transform: end, opacity: 1 },
    ],
    { duration, easing },
  )
  anim.onfinish = () => {
    img.remove()
    onDone()
  }
}
