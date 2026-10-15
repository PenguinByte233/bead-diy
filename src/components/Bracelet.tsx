import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { BeadInstance } from '../types'
import { beadPositions, beadRadius } from '../utils/geometry'
import BeadGlyph from './BeadGlyph'

interface BraceletProps {
  beads: BeadInstance[]
  onRemove: (instanceId: string) => void
  /** 将 instanceId 对应的珠子移动到目标槽位 */
  onMove: (instanceId: string, to: number) => void
  /** 拖动开始时调用一次（用于记录撤销快照） */
  onDragStart: () => void
}

const SIZE = 320
const CENTER = SIZE / 2
const BRACELET_RADIUS = SIZE * 0.40
// 移动超过该距离（px）才判定为拖动，否则视为点击删除
const DRAG_THRESHOLD = 6

interface DragState {
  pointerId: number
  instanceId: string
  startX: number
  startY: number
  dragging: boolean
}

export default function Bracelet({ beads, onRemove, onMove, onDragStart }: BraceletProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const count = beads.length
  const r = beadRadius(count, BRACELET_RADIUS)
  const positions = beadPositions(count, CENTER, CENTER, BRACELET_RADIUS)

  // 将屏幕坐标映射到手串槽位 index（与 beadPositions 的角度约定一致）
  const indexAt = (clientX: number, clientY: number): number => {
    const rect = svgRef.current!.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let angle = Math.atan2(clientY - cy, clientX - cx) + Math.PI / 2
    if (angle < 0) angle += 2 * Math.PI
    return Math.round(angle / ((2 * Math.PI) / count)) % count
  }

  const handlePointerDown = (e: ReactPointerEvent<SVGGElement>, instanceId: string) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({
      pointerId: e.pointerId,
      instanceId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
    })
  }

  const handlePointerMove = (e: ReactPointerEvent<SVGGElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (!drag.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      onDragStart()
      setDrag((d) => (d ? { ...d, dragging: true } : d))
      return
    }

    onMove(drag.instanceId, indexAt(e.clientX, e.clientY))
  }

  const handlePointerUp = (e: ReactPointerEvent<SVGGElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    // 未发生拖动的轻点 → 删除该珠子
    if (!drag.dragging) {
      onRemove(drag.instanceId)
    }
    setDrag(null)
  }

  const handlePointerCancel = () => setDrag(null)

  return (
    <svg
      ref={svgRef}
      className="bracelet-svg"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="手串预览"
    >
      {/* 串绳（珠子排列的路径参考） */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={BRACELET_RADIUS}
        fill="none"
        stroke="#000000"
        strokeWidth={Math.max(r * 0.35, 2)}
      />

      {positions.map((p, i) => {
        const bead = beads[i]
        const isDragging = drag?.dragging && drag.instanceId === bead.instanceId
        return (
          <g
            key={bead.instanceId}
            transform={`translate(${p.x} ${p.y})${isDragging ? ' scale(1.2)' : ''}`}
            className={`bracelet-bead${isDragging ? ' is-dragging' : ''}`}
            onPointerDown={(e) => handlePointerDown(e, bead.instanceId)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <BeadGlyph
              color={bead.color}
              image={bead.image}
              r={r}
              gradientId={`bracelet-${bead.instanceId}`}
              gloss={bead.gloss}
            />
          </g>
        )
      })}

      {/* 中心数量提示 */}
      <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="bracelet-count">
        {count === 0 ? '' : `${count} 颗`}
      </text>
      {count === 0 && (
        <text x={CENTER} y={CENTER + 18} textAnchor="middle" className="bracelet-hint">
          点击下方珠子开始搭配
        </text>
      )}
    </svg>
  )
}
