import { useEffect, useRef, useState } from 'react'
import Bracelet from './components/Bracelet'
import BeadPalette from './components/BeadPalette'
import { beads as beadCatalog, categories, ropes, defaultRope } from './data/beads'
import { downloadBraceletImage } from './utils/exportImage'
import type { BeadInstance, BeadType, Design, RopeType } from './types'

let nextId = 1
function makeInstance(bead: BeadType): BeadInstance {
  return { ...bead, instanceId: `inst-${nextId++}` }
}

const DESIGNS_KEY = 'bead-diy-designs'

function loadDesigns(): Design[] {
  try {
    const raw = localStorage.getItem(DESIGNS_KEY)
    return raw ? (JSON.parse(raw) as Design[]) : []
  } catch {
    return []
  }
}

export default function App() {
  const [bracelet, setBracelet] = useState<BeadInstance[]>([])
  const [rope, setRope] = useState<RopeType>(defaultRope)
  const [history, setHistory] = useState<BeadInstance[][]>([])
  const [designs, setDesigns] = useState<Design[]>(loadDesigns)
  const [savedFlash, setSavedFlash] = useState(false)
  const braceletAreaRef = useRef<HTMLElement>(null)

  // 设计持久化到本地，刷新后仍在
  useEffect(() => {
    try {
      localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs))
    } catch {
      // 忽略存储失败（如隐私模式）
    }
  }, [designs])

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

  const dragStart = () => {
    setHistory((h) => [...h, bracelet])
  }

  const undo = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setBracelet(prev)
    setHistory(history.slice(0, -1))
  }

  const saveDesign = () => {
    if (bracelet.length === 0) return
    const design: Design = {
      id: `d-${Date.now()}`,
      name: `设计 ${designs.length + 1}`,
      beadIds: bracelet.map((b) => b.id),
      ropeId: rope.id,
      createdAt: Date.now(),
    }
    setDesigns((prev) => [design, ...prev])
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1500)
  }

  const loadDesign = (design: Design) => {
    const next = design.beadIds
      .map((id) => beadCatalog.find((b) => b.id === id))
      .filter((b): b is BeadType => Boolean(b))
      .map(makeInstance)
    setBracelet(next)
    const savedRope = ropes.find((r) => r.id === design.ropeId)
    if (savedRope) setRope(savedRope)
  }

  const screenshot = async () => {
    if (bracelet.length === 0) return
    const svg = braceletAreaRef.current?.querySelector<SVGSVGElement>('svg')
    if (!svg) return
    try {
      await downloadBraceletImage(svg)
    } catch (err) {
      console.error(err)
      alert('截图生成失败')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <h1>珠串 DIY</h1>
          <p className="app-subtitle">点击下方珠子，搭配你的专属手串</p>
        </div>
        <div className="toolbar">
          <button className="tool-btn" onClick={undo} disabled={history.length === 0}>
            撤销
          </button>
          <button className="tool-btn" onClick={clearAll} disabled={bracelet.length === 0}>
            清空
          </button>
          <button className="tool-btn" onClick={saveDesign} disabled={bracelet.length === 0}>
            {savedFlash ? '已保存' : '保存'}
          </button>
          <button className="tool-btn" onClick={screenshot} disabled={bracelet.length === 0}>
            截图
          </button>
        </div>
      </header>

      <section className="bracelet-area" ref={braceletAreaRef}>
        <Bracelet
          beads={bracelet}
          rope={rope}
          onRemove={removeBead}
          onMove={moveBead}
          onDragStart={dragStart}
        />
      </section>

      <section className="palette-area">
        <BeadPalette
          beads={beadCatalog}
          categories={categories}
          ropes={ropes}
          activeRopeId={rope.id}
          designs={designs}
          onAdd={addBead}
          onSelectRope={setRope}
          onLoadDesign={loadDesign}
        />
      </section>
    </div>
  )
}
