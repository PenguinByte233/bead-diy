import { useState } from 'react'
import type { BeadCategory, BeadType } from '../types'
import BeadGlyph from './BeadGlyph'

interface BeadPaletteProps {
  beads: BeadType[]
  categories: BeadCategory[]
  onAdd: (bead: BeadType) => void
}

const PREVIEW_R = 14

export default function BeadPalette({ beads, categories, onAdd }: BeadPaletteProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const visible =
    activeCategory === 'all' ? beads : beads.filter((b) => b.category === activeCategory)

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
          </button>
        ))}
      </div>

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
    </div>
  )
}
