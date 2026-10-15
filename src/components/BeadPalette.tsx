import { useMemo, useState } from 'react'
import type { BeadCategory, BeadType, Design } from '../types'
import { beadPositions, beadRadius } from '../utils/geometry'
import BeadGlyph from './BeadGlyph'

interface BeadPaletteProps {
  beads: BeadType[]
  categories: BeadCategory[]
  designs: Design[]
  onAdd: (bead: BeadType) => void
  onLoadDesign: (design: Design) => void
}

const PREVIEW_R = 14

// 已保存设计的迷你手串预览
function DesignThumb({
  beadIds,
  beadsById,
  designId,
}: {
  beadIds: string[]
  beadsById: Map<string, BeadType>
  designId: string
}) {
  const SIZE = 72
  const CENTER = SIZE / 2
  const RADIUS = SIZE * 0.34
  const items = beadIds.map((id) => beadsById.get(id)).filter((b): b is BeadType => Boolean(b))
  if (items.length === 0) return <span className="design-thumb-empty">空</span>
  const r = beadRadius(items.length, RADIUS)
  const positions = beadPositions(items.length, CENTER, CENTER, RADIUS)
  return (
    <svg className="design-thumb-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke="#000000"
        strokeWidth={Math.max(r * 0.3, 1.5)}
      />
      {positions.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <BeadGlyph
            color={items[i].color}
            image={items[i].image}
            r={r}
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
  designs,
  onAdd,
  onLoadDesign,
}: BeadPaletteProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const beadsById = useMemo(() => new Map(beads.map((b) => [b.id, b])), [beads])

  const isDesignTab = activeCategory === 'design'
  const visible = beads.filter((b) => b.category === activeCategory)
  const countFor = (id: string) =>
    id === 'design' ? designs.length : beads.filter((b) => b.category === id).length

  return (
    <div className="palette">
      <div className="palette-tabs">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`palette-tab${c.id === activeCategory ? ' is-active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
            <span className="palette-tab-count">{countFor(c.id)}</span>
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
                <DesignThumb beadIds={d.beadIds} beadsById={beadsById} designId={d.id} />
                <span className="design-name">{d.name}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="palette-grid">
          {visible.map((bead) => (
            <button
              key={bead.id}
              className="palette-item"
              onClick={() => onAdd(bead)}
              title={`添加 ${bead.name}`}
            >
              <svg className="palette-item-svg" viewBox="0 0 32 32" aria-hidden="true">
                <g transform="translate(16 16)">
                  <BeadGlyph
                    color={bead.color}
                    image={bead.image}
                    r={PREVIEW_R}
                    gradientId={`palette-${bead.id}`}
                    gloss={bead.gloss}
                  />
                </g>
              </svg>
              <span className="palette-item-name">{bead.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
