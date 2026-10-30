import { useRef } from 'react'
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import type { BeadInstance } from '../types'
import { DEFAULT_BEAD_DIAMETER } from '../utils/geometry'
import BeadGlyph from './BeadGlyph'

interface SelectedBeadsProps {
  beads: BeadInstance[]
  onRemove: (instanceId: string) => void
}

/**
 * 已选珠子横向栏的中间滚动区：展示当前手串上的珠子缩略图，点击单颗即可移除。
 * 滚轮条已隐藏，桌面端补充「滚轮 + 鼠标按住拖动」来横向滑动，避免仅鼠标时无法滚动。
 * 左侧「已选珠子」说明与右侧「共 N 颗」数量由 App 渲染，这里只负责珠子列表。
 */
export default function SelectedBeads({ beads, onRemove }: SelectedBeadsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ pointerId: -1, startX: 0, startLeft: 0, dragging: false, didDrag: false })

  // 滚轮：把纵向滚动转换为横向滚动
  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      el.scrollLeft += px
    }
  }

  // 鼠标按住拖动横向滚动；触屏走浏览器原生横向滑动
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollRef.current
    if (!el) return
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      dragging: false,
      didDrag: false,
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = drag.current
    if (s.pointerId !== e.pointerId) return
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const dx = e.clientX - s.startX
    if (!s.dragging && Math.abs(dx) < 6) return
    s.dragging = true
    s.didDrag = true
    el.scrollLeft = s.startLeft - dx
  }

  const handlePointerUp = () => {
    drag.current.pointerId = -1
  }

  // 拖动结束后阻止这次点击，避免「滑动珠子」误触成「移除珠子」
  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (drag.current.didDrag) {
      e.stopPropagation()
      e.preventDefault()
      drag.current.didDrag = false
    }
  }

  if (beads.length === 0) {
    return (
      <div className="selected-beads selected-beads-empty">
        <p className="selected-empty">还没选珠子</p>
      </div>
    )
  }

  return (
    <div
      className="selected-beads"
      ref={scrollRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
    >
      {beads.map((bead) => (
        <button
          key={bead.instanceId}
          type="button"
          className="selected-item"
          aria-label={`移除 ${bead.name}`}
          title="点击移除"
          onClick={() => onRemove(bead.instanceId)}
        >
          <svg className="selected-item-svg" viewBox="0 0 32 32" aria-hidden="true">
            <g transform="translate(16 16)">
              <BeadGlyph
                color={bead.color}
                image={bead.image}
                imageFit={bead.imageFit}
                r={(14 * (bead.diameter ?? DEFAULT_BEAD_DIAMETER)) / DEFAULT_BEAD_DIAMETER}
                gradientId={`selected-${bead.instanceId}`}
                gloss={bead.gloss}
              />
            </g>
          </svg>
        </button>
      ))}
    </div>
  )
}
