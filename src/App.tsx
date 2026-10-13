import { useState } from 'react'
import Bracelet from './components/Bracelet'
import BeadPalette from './components/BeadPalette'
import { beads as beadCatalog, categories } from './data/beads'
import type { BeadInstance, BeadType } from './types'

let nextId = 1
function makeInstance(bead: BeadType): BeadInstance {
  return { ...bead, instanceId: `inst-${nextId++}` }
}

export default function App() {
  const [bracelet, setBracelet] = useState<BeadInstance[]>([])
  // 历史快照，用于「撤销」上一步操作
  const [history, setHistory] = useState<BeadInstance[][]>([])

  // 增删操作前记录当前状态，便于撤销
  const commit = (next: BeadInstance[]) => {
    setHistory((h) => [...h, bracelet])
    setBracelet(next)
  }

  const addBead = (bead: BeadType) => commit([...bracelet, makeInstance(bead)])

  const removeBead = (instanceId: string) =>
    commit(bracelet.filter((b) => b.instanceId !== instanceId))

  const clearAll = () => {
    if (bracelet.length === 0) return
    commit([])
  }

  // 拖动排序：按 instanceId 定位当前下标，移动到目标槽位（不额外记历史）
  const moveBead = (instanceId: string, to: number) => {
    setBracelet((prev) => {
      const from = prev.findIndex((b) => b.instanceId === instanceId)
      if (from < 0 || from === to) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  // 拖动开始时记录一次快照，供「撤销」恢复拖动前的顺序
  const dragStart = () => {
    setHistory((h) => [...h, bracelet])
  }

  const undo = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setBracelet(prev)
    setHistory(history.slice(0, -1))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>珠串 DIY</h1>
        <p className="app-subtitle">点击下方珠子，搭配你的专属手串</p>
      </header>

      <section className="bracelet-area">
        <Bracelet
          beads={bracelet}
          onRemove={removeBead}
          onMove={moveBead}
          onDragStart={dragStart}
        />
        <p className="bracelet-tip">提示：点按珠子可移除，按住拖动可调整顺序</p>
        <div className="toolbar">
          <button className="tool-btn" onClick={undo} disabled={history.length === 0}>
            撤销
          </button>
          <button className="tool-btn" onClick={clearAll} disabled={bracelet.length === 0}>
            清空
          </button>
        </div>
      </section>

      <section className="palette-area">
        <BeadPalette beads={beadCatalog} categories={categories} onAdd={addBead} />
      </section>
    </div>
  )
}
