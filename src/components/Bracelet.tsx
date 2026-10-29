import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { BeadInstance, RopeType } from '../types'
import { layoutBeads, DEFAULT_BEAD_DIAMETER, fullCountForDiameter } from '../utils/geometry'
import BeadGlyph from './BeadGlyph'
import RopeRing from './RopeRing'

interface BraceletProps {
  beads: BeadInstance[]
  /** 当前串绳 */
  rope: RopeType
  onRemove: (instanceId: string) => void
  /** 将 instanceId 对应的珠子移动到目标槽位 */
  onMove: (instanceId: string, to: number) => void
  /** 拖动开始时调用一次（用于记录撤销快照） */
  onDragStart: () => void
  /** 是否渲染中心的数量 / 空状态提示（3D 场景下由外层 DOM 覆盖层负责） */
  showLabels?: boolean
}

const SIZE = 320
const CENTER = SIZE / 2
// 手串半径：需保证满编 10 颗时珠子最外缘（半径 + 珠半径 ≈ 半径 × 1.309）不超出 viewBox，
// 并给投影留出余量。珠半径、绳粗细都由此半径推导，改这里即可整体缩放。
const BRACELET_RADIUS = SIZE * 0.35
// 移动超过该距离（px）才判定为拖动，否则视为点击删除
const DRAG_THRESHOLD = 6

interface DragState {
  pointerId: number
  instanceId: string
  startX: number
  startY: number
  dragging: boolean
}

export default function Bracelet({
  beads,
  rope,
  onRemove,
  onMove,
  onDragStart,
  showLabels = true,
}: BraceletProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const count = beads.length
  const layout = layoutBeads(beads.map((b) => b.diameter), CENTER, CENTER, BRACELET_RADIUS)
  // 绳体粗细以默认直径（10mm）满编珠子为固定参考，不随当前颗数/直径变化
  const referenceBeadRadius =
    BRACELET_RADIUS * Math.sin(Math.PI / fullCountForDiameter(DEFAULT_BEAD_DIAMETER))
  const ropeThickness = Math.max(referenceBeadRadius * 0.6, 3)

  // 将屏幕坐标映射到最近珠子的 index（混用直径时角度非均匀，按距离找最近珠心）
  const indexAt = (clientX: number, clientY: number): number => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scale = rect.width / SIZE
    const px = (clientX - rect.left - rect.width / 2) / scale + CENTER
    const py = (clientY - rect.top - rect.height / 2) / scale + CENTER
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < layout.positions.length; i++) {
      const p = layout.positions[i]
      const d = (px - p.x) * (px - p.x) + (py - p.y) * (py - p.y)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return best
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
      <g transform={`translate(${CENTER} ${CENTER})`}>
        <RopeRing rope={rope} radius={BRACELET_RADIUS} thickness={ropeThickness} id="bracelet-rope" />
      </g>

      {layout.positions.map((p, i) => {
        const bead = beads[i]
        const r = layout.radii[i]
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
              imageFit={bead.imageFit}
              r={r}
              gradientId={`bracelet-${bead.instanceId}`}
              gloss={bead.gloss}
            />
          </g>
        )
      })}

      {/* 中心数量提示 */}
      {showLabels && (
        <>
          <text x={CENTER} y={CENTER - 4} textAnchor="middle" className="bracelet-count">
            {count === 0 ? '' : `${count} 颗`}
          </text>
          {count === 0 && (
            <text x={CENTER} y={CENTER + 18} textAnchor="middle" className="bracelet-hint">
              点击下方珠子开始搭配
            </text>
          )}
        </>
      )}
    </svg>
  )
}
