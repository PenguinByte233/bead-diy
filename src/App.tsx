import { useEffect, useRef, useState } from 'react'
import Bracelet from './components/Bracelet'
import BeadPalette from './components/BeadPalette'
import { beads as beadCatalog, categories, ropes } from './data/beads'
import { downloadBraceletImage } from './utils/exportImage'
import { flyBead } from './utils/flyBead'
import Bracelet3D from './three/Bracelet3D'
import { cordTypeForRopeId } from './three/cords'
import { beadWorldPositions, beadWorldRadius, CAMERA_HALF } from './three/geometry3d'
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

// 当前产品仅启用三种绳子（透明弹力绳 / 酒红色实心绳 / 黑色弹力绳），其余素材保留待用
const ACTIVE_ROPE_IDS = ['rope-clear-elastic', 'rope-wine-solid', 'rope-black-elastic']
const activeRopes = ropes.filter((r) => ACTIVE_ROPE_IDS.includes(r.id))

export default function App() {
  const [bracelet, setBracelet] = useState<BeadInstance[]>([])
  const [rope, setRope] = useState<RopeType>(activeRopes[0])
  const [history, setHistory] = useState<BeadInstance[][]>([])
  const [designs, setDesigns] = useState<Design[]>(loadDesigns)
  const [savedFlash, setSavedFlash] = useState(false)
  const braceletAreaRef = useRef<HTMLElement>(null)
  // 3D 画布所在的正方形舞台：飞入动画用它的实际尺寸把世界坐标映射为屏幕坐标
  const stageRef = useRef<HTMLDivElement>(null)

  // 最新手串快照：飞入动画结束后异步提交时，据此拿到「加入前」状态记录撤销
  const braceletRef = useRef(bracelet)
  useEffect(() => {
    braceletRef.current = bracelet
  }, [bracelet])

  // 飞行中、尚未落定的珠子数：保证快速连点时各飞入目标槽位不重叠
  const inFlightRef = useRef(0)

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

  const addBead = (bead: BeadType, fromEl?: HTMLElement) => {
    const stage = stageRef.current
    // 目标槽位 = 已落定珠子数 + 飞行中珠子数（同步递增，避免连点时飞向同一槽位）
    const slot = braceletRef.current.length + inFlightRef.current
    const nextCount = slot + 1

    if (!stage) {
      setHistory((h) => [...h, braceletRef.current])
      setBracelet((prev) => [...prev, makeInstance(bead)])
      return
    }

    const stageRect = stage.getBoundingClientRect()
    const scale = stageRect.width / (2 * CAMERA_HALF)
    const target = beadWorldPositions(nextCount)[slot]
    const to = {
      x: stageRect.left + stageRect.width / 2 + target.x * scale,
      y: stageRect.top + stageRect.height / 2 + target.y * scale,
    }
    const srcRect = fromEl?.getBoundingClientRect()
    const from = srcRect
      ? { x: srcRect.left + srcRect.width / 2, y: srcRect.top + srcRect.height / 2 }
      : { x: stageRect.left + stageRect.width / 2, y: stageRect.bottom }
    const screenDiameter = (beadWorldRadius(nextCount) / CAMERA_HALF) * stageRect.width

    inFlightRef.current += 1
    flyBead(bead, from, to, screenDiameter, () => {
      inFlightRef.current -= 1
      setHistory((h) => [...h, braceletRef.current])
      setBracelet((prev) => [...prev, makeInstance(bead)])
    })
  }

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
    const savedRope = activeRopes.find((r) => r.id === design.ropeId)
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
        <div className="bracelet-stage" ref={stageRef}>
          <Bracelet3D
            beads={bracelet}
            cordType={cordTypeForRopeId(rope.id)}
            onRemove={removeBead}
            fallback={
              <Bracelet
                beads={bracelet}
                rope={rope}
                onRemove={removeBead}
                onMove={moveBead}
                onDragStart={dragStart}
                showLabels={false}
              />
            }
          />
          <div className="bracelet-stage-overlay">
            {bracelet.length > 0 ? (
              <span className="bracelet-count-text">{bracelet.length} 颗</span>
            ) : (
              <span className="bracelet-hint-text">点击下方珠子开始搭配</span>
            )}
          </div>
        </div>
      </section>

      <section className="palette-area">
        <BeadPalette
          beads={beadCatalog}
          categories={categories}
          ropes={activeRopes}
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
