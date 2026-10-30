import { useMemo, useRef } from 'react'
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import type { BeadCategory, BeadType, Design, RopeType } from '../types'
import {
  BEAD_DIAMETERS,
  layoutBeads,
  DEFAULT_BEAD_DIAMETER,
  fullCountForDiameter,
} from '../utils/geometry'
import BeadGlyph from './BeadGlyph'
import RopeRing from './RopeRing'

// 素材区分类：crystal 珠子（按规格过滤）/ accessory 配件（绳子）/ design 我的设计
export type PaletteCategory = 'crystal' | 'accessory' | 'design'

interface BeadPaletteProps {
  beads: BeadType[]
  categories: BeadCategory[]
  /** 串绳素材（配件分类） */
  ropes: RopeType[]
  /** 当前选中的绳子 id，用于高亮 */
  activeRopeId: string
  designs: Design[]
  /** 当前选中规格（mm），仅 crystal 分类下生效 */
  activeDiameter: number
  /** 当前选中分类 */
  activeCategory: PaletteCategory
  onSelectDiameter: (diameter: number) => void
  onSelectCategory: (category: PaletteCategory) => void
  onAdd: (bead: BeadType, fromEl?: HTMLElement) => void
  onSelectRope: (rope: RopeType) => void
  onLoadDesign: (design: Design) => void
  /** 判断某颗珠子当前能否加入（满编判断），返回 false 时该珠子按钮禁用 */
  canAdd?: (bead: BeadType) => boolean
}

// 素材区珠子预览半径：以 10mm 为基准，直径越小预览越小，直观区分三种尺寸
const PREVIEW_R = 14
// 素材区绳环缩略图的半径与粗细
const ROPE_PREVIEW_RADIUS = 13
const ROPE_PREVIEW_THICKNESS = 5

// 已保存设计的迷你手串预览
function DesignThumb({
  beadIds,
  beadsById,
  rope,
  designId,
}: {
  beadIds: string[]
  beadsById: Map<string, BeadType>
  rope: RopeType
  designId: string
}) {
  const SIZE = 72
  const CENTER = SIZE / 2
  const RADIUS = SIZE * 0.34
  const items = beadIds.map((id) => beadsById.get(id)).filter((b): b is BeadType => Boolean(b))
  if (items.length === 0) return <span className="design-thumb-empty">空</span>
  const layout = layoutBeads(items.map((it) => it.diameter), CENTER, CENTER, RADIUS)
  const referenceBeadRadius =
    RADIUS * Math.sin(Math.PI / fullCountForDiameter(DEFAULT_BEAD_DIAMETER))
  return (
    <svg className="design-thumb-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <g transform={`translate(${CENTER} ${CENTER})`}>
        <RopeRing
          rope={rope}
          radius={RADIUS}
          thickness={Math.max(referenceBeadRadius * 0.6, 2)}
          id={`design-${designId}-rope`}
        />
      </g>
      {layout.positions.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <BeadGlyph
            color={items[i].color}
            image={items[i].image}
            imageFit={items[i].imageFit}
            r={layout.radii[i]}
            gradientId={`design-${designId}-${i}`}
            gloss={items[i].gloss}
          />
        </g>
      ))}
    </svg>
  )
}

export default function BeadPalette({
  beads,
  categories,
  ropes,
  activeRopeId,
  designs,
  activeDiameter,
  activeCategory,
  onSelectDiameter,
  onSelectCategory,
  onAdd,
  onSelectRope,
  onLoadDesign,
  canAdd,
}: BeadPaletteProps) {
  const beadsById = useMemo(() => new Map(beads.map((b) => [b.id, b])), [beads])
  const ropesById = useMemo(() => new Map(ropes.map((r) => [r.id, r])), [ropes])

  const isAccessoryTab = activeCategory === 'accessory'
  const isDesignTab = activeCategory === 'design'
  // 水晶栏按当前规格过滤；配件 / 我的设计不展示珠子
  const visible = beads.filter((b) => b.category === 'crystal' && b.diameter === activeDiameter)

  // —— 顶部 tab 行的横向滚动：桌面端支持滚轮 + 鼠标按住拖动 ——
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabsDrag = useRef({ pointerId: -1, startX: 0, startLeft: 0, dragging: false, didDrag: false })

  const handleTabsWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const el = tabsRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      el.scrollLeft += px
    }
  }

  const handleTabsPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = tabsRef.current
    if (!el) return
    tabsDrag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      dragging: false,
      didDrag: false,
    }
  }

  const handleTabsPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = tabsDrag.current
    if (s.pointerId !== e.pointerId) return
    const el = tabsRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const dx = e.clientX - s.startX
    if (!s.dragging && Math.abs(dx) < 6) return
    s.dragging = true
    s.didDrag = true
    el.scrollLeft = s.startLeft - dx
  }

  const handleTabsPointerUp = () => {
    tabsDrag.current.pointerId = -1
  }

  const handleTabsClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (tabsDrag.current.didDrag) {
      e.stopPropagation()
      e.preventDefault()
      tabsDrag.current.didDrag = false
    }
  }

  // 规格 tab：切规格同时切到 crystal 分类
  const selectDiameter = (d: number) => {
    onSelectDiameter(d)
    onSelectCategory('crystal')
  }

  return (
    <div className="palette">
      <div
        className="palette-tabs"
        ref={tabsRef}
        onWheel={handleTabsWheel}
        onPointerDown={handleTabsPointerDown}
        onPointerMove={handleTabsPointerMove}
        onPointerUp={handleTabsPointerUp}
        onPointerCancel={handleTabsPointerUp}
        onClickCapture={handleTabsClickCapture}
      >
        {BEAD_DIAMETERS.map((d) => (
          <button
            key={`crystal-${d}`}
            className={`palette-tab${activeCategory === 'crystal' && activeDiameter === d ? ' is-active' : ''}`}
            onClick={() => selectDiameter(d)}
          >
            {d}mm
          </button>
        ))}
        {categories
          .filter((c) => c.id !== 'crystal')
          .map((c) => (
            <button
              key={c.id}
              className={`palette-tab${activeCategory === c.id ? ' is-active' : ''}`}
              onClick={() => onSelectCategory(c.id as PaletteCategory)}
            >
              {c.label}
            </button>
          ))}
      </div>

      {isDesignTab ? (
        <div className="design-list">
          {designs.length === 0 ? (
            <p className="design-empty">暂无设计，先搭配一串并点击右上角「保存」</p>
          ) : (
            designs.map((d) => (
              <button key={d.id} className="design-card" onClick={() => onLoadDesign(d)}>
                <DesignThumb
                  beadIds={d.beadIds}
                  beadsById={beadsById}
                  rope={ropesById.get(d.ropeId ?? '') ?? ropes[0]}
                  designId={d.id}
                />
                <span className="design-name">{d.name}</span>
              </button>
            ))
          )}
        </div>
      ) : isAccessoryTab ? (
        <div className="palette-grid">
          {ropes.map((rope) => (
            <button
              key={rope.id}
              className={`palette-item${rope.id === activeRopeId ? ' is-selected' : ''}`}
              onClick={() => onSelectRope(rope)}
              title={`使用 ${rope.name}`}
            >
              <svg className="palette-item-svg" viewBox="0 0 32 32" aria-hidden="true">
                <g transform="translate(16 16)">
                  <RopeRing
                    rope={rope}
                    radius={ROPE_PREVIEW_RADIUS}
                    thickness={ROPE_PREVIEW_THICKNESS}
                    id={`palette-rope-${rope.id}`}
                  />
                </g>
              </svg>
              <span className="palette-item-name">{rope.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="palette-grid">
          {visible.map((bead) => {
            const disabled = canAdd ? !canAdd(bead) : false
            return (
              <button
                key={bead.id}
                className="palette-item"
                disabled={disabled}
                onClick={(e) => onAdd(bead, e.currentTarget)}
                title={disabled ? '手串已满' : `添加 ${bead.name}`}
              >
                <svg className="palette-item-svg" viewBox="0 0 32 32" aria-hidden="true">
                  <g transform="translate(16 16)">
                    <BeadGlyph
                      color={bead.color}
                      image={bead.image}
                      imageFit={bead.imageFit}
                      r={(PREVIEW_R * (bead.diameter ?? DEFAULT_BEAD_DIAMETER)) / DEFAULT_BEAD_DIAMETER}
                      gradientId={`palette-${bead.id}`}
                      gloss={bead.gloss}
                    />
                  </g>
                </svg>
                <span className="palette-item-name">{bead.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
