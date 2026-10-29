import { useMemo, useRef, useState } from 'react'
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

interface BeadPaletteProps {
  beads: BeadType[]
  categories: BeadCategory[]
  /** 串绳素材（配件分类） */
  ropes: RopeType[]
  /** 当前选中的绳子 id，用于高亮 */
  activeRopeId: string
  designs: Design[]
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

// 顶部 tab 项：水晶宝石按直径拆成多个入口，配件 / 我的设计保持原样
interface PaletteTab {
  id: string
  label: string
  category: string
  diameter?: number
}

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
  onAdd,
  onSelectRope,
  onLoadDesign,
  canAdd,
}: BeadPaletteProps) {
  // 顶部 tab 同一行展示：水晶宝石按 6/8/10mm 拆成三个入口，与配件、我的设计并列
  const tabs = useMemo<PaletteTab[]>(() => {
    const crystalLabel = categories.find((c) => c.id === 'crystal')?.label ?? '水晶宝石'
    return [
      ...BEAD_DIAMETERS.map((d) => ({
        id: `crystal-${d}`,
        label: `${d}mm${crystalLabel}`,
        category: 'crystal',
        diameter: d,
      })),
      ...categories
        .filter((c) => c.id !== 'crystal')
        .map((c) => ({ id: c.id, label: c.label, category: c.id })),
    ]
  }, [categories])
  const [activeTabId, setActiveTabId] = useState<string>(`crystal-${DEFAULT_BEAD_DIAMETER}`)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  const beadsById = useMemo(() => new Map(beads.map((b) => [b.id, b])), [beads])
  const ropesById = useMemo(() => new Map(ropes.map((r) => [r.id, r])), [ropes])

  const isAccessoryTab = activeTab.category === 'accessory'
  const isDesignTab = activeTab.category === 'design'
  // 水晶栏按当前 tab 的直径筛选；其余栏不展示珠子，visible 仅用于水晶栏
  const visible =
    activeTab.diameter != null
      ? beads.filter((b) => b.category === 'crystal' && b.diameter === activeTab.diameter)
      : []
  const countFor = (tab: PaletteTab) => {
    if (tab.category === 'design') return designs.length
    if (tab.category === 'accessory') return ropes.length
    return beads.filter((b) => b.category === 'crystal' && b.diameter === tab.diameter).length
  }

  // —— 顶部 tab 行的横向滚动：桌面端支持滚轮 + 鼠标按住拖动 ——
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabsDrag = useRef({ pointerId: -1, startX: 0, startLeft: 0, dragging: false, didDrag: false })

  // 滚轮：纵向滚动映射为横向滚动（触控板的横向滚轮由浏览器原生处理）
  const handleTabsWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const el = tabsRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      el.scrollLeft += px
    }
  }

  // 鼠标按住拖动横向滚动；触屏交给 overflow-x 原生滚动，避免双重处理
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

  // 拖动结束后抑制误触发的 tab 点击（正常点按不受影响）
  const handleTabsClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (tabsDrag.current.didDrag) {
      e.stopPropagation()
      e.preventDefault()
      tabsDrag.current.didDrag = false
    }
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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`palette-tab${tab.id === activeTabId ? ' is-active' : ''}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
            <span className="palette-tab-count">{countFor(tab)}</span>
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
