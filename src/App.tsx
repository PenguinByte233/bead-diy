import { useEffect, useRef, useState } from 'react'
import Bracelet from './components/Bracelet'
import BeadPalette, { type PaletteCategory } from './components/BeadPalette'
import SelectedBeads from './components/SelectedBeads'
import { beads as beadCatalog, categories, ropes } from './data/beads'
import { downloadBraceletImage, downloadCanvasImage } from './utils/exportImage'
import { flyBead } from './utils/flyBead'
import Bracelet3D from './three/Bracelet3D'
import { cordTypeForRopeId } from './three/cords'
import { beadWorldLayout, CAMERA_HALF } from './three/geometry3d'
import {
  DEFAULT_BEAD_DIAMETER,
  braceletFullness,
  fullCountForDiameter,
  wristCircumference,
} from './utils/geometry'
import type { BeadInstance, BeadType, Design, RopeType } from './types'

let nextId = 1
function makeInstance(bead: BeadType): BeadInstance {
  return { ...bead, instanceId: `inst-${nextId++}` }
}

// 满编判断的浮点容差：占用率之和在此误差内视为满编
const FULL_EPS = 1e-9
function canAddToBracelet(diameters: (number | undefined)[], next?: number): boolean {
  return braceletFullness(diameters) + 1 / fullCountForDiameter(next) <= 1 + FULL_EPS
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
  // 素材区当前规格与分类（提升到 App，供预览信息行与网格共用）
  const [activeDiameter, setActiveDiameter] = useState<number>(DEFAULT_BEAD_DIAMETER)
  const [activeCategory, setActiveCategory] = useState<PaletteCategory>('crystal')
  const braceletAreaRef = useRef<HTMLElement>(null)
  // 3D 画布所在的正方形舞台：飞入动画用它的实际尺寸把世界坐标映射为屏幕坐标
  const stageRef = useRef<HTMLDivElement>(null)

  // 最新手串快照：飞入动画结束后异步提交时，据此拿到「加入前」状态记录撤销
  const braceletRef = useRef(bracelet)
  useEffect(() => {
    braceletRef.current = bracelet
  }, [bracelet])

  // 飞行中、尚未落定的珠子直径：快速连点时据此计算飞入目标槽位并参与满编判断
  const inFlightDiametersRef = useRef<(number | undefined)[]>([])

  // 当前串的占用率：用于素材区满编禁用判断
  const diameters = bracelet.map((b) => b.diameter)
  const canAddBead = (bead: BeadType) => canAddToBracelet(diameters, bead.diameter)

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
    const committedDiameters = braceletRef.current.map((b) => b.diameter)
    // 满编判断：已落定 + 飞行中 + 新珠，占用率不能超过 1（满了不允许再加）
    if (!canAddToBracelet([...committedDiameters, ...inFlightDiametersRef.current], bead.diameter)) {
      return
    }

    const stage = stageRef.current
    if (!stage) {
      setHistory((h) => [...h, braceletRef.current])
      setBracelet((prev) => [...prev, makeInstance(bead)])
      return
    }

    // 新珠追加到末尾，用「已落定 + 飞行中 + 新珠」的完整布局取最后落点与半径
    const layout = beadWorldLayout([
      ...committedDiameters,
      ...inFlightDiametersRef.current,
      bead.diameter,
    ])
    const last = layout.positions.length - 1
    const target = layout.positions[last]

    const stageRect = stage.getBoundingClientRect()
    const scale = stageRect.width / (2 * CAMERA_HALF)
    // 3D 世界坐标 y 轴向上，DOM 屏幕坐标 y 轴向下，映射时需对 y 取反，
    // 否则飞入终点与珠子实际落点上下镜像错位，珠子会在落地瞬间「闪现」到别处。
    const to = {
      x: stageRect.left + stageRect.width / 2 + target.x * scale,
      y: stageRect.top + stageRect.height / 2 - target.y * scale,
    }
    const srcRect = fromEl?.getBoundingClientRect()
    const from = srcRect
      ? { x: srcRect.left + srcRect.width / 2, y: srcRect.top + srcRect.height / 2 }
      : { x: stageRect.left + stageRect.width / 2, y: stageRect.bottom }
    const screenDiameter = (layout.radii[last] / CAMERA_HALF) * stageRect.width

    inFlightDiametersRef.current.push(bead.diameter)
    flyBead(bead, from, to, screenDiameter, () => {
      // flyBead 时长固定、按启动顺序完成，FIFO 弹出第一个飞行中的直径即可
      inFlightDiametersRef.current.shift()
      setHistory((h) => [...h, braceletRef.current])
      setBracelet((prev) => [...prev, makeInstance(bead)])
    })
  }

  const removeBead = (instanceId: string) =>
    commit(bracelet.filter((b) => b.instanceId !== instanceId))

  // 重置：清空珠子并恢复到默认规格（10mm）+ 默认绳
  const resetAll = () => {
    if (bracelet.length > 0) commit([])
    setActiveDiameter(DEFAULT_BEAD_DIAMETER)
    setActiveCategory('crystal')
    setRope(activeRopes[0])
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
    const area = braceletAreaRef.current
    if (!area) return
    // 3D 模式下取 WebGL 画布；降级回 SVG 版本时取 svg 元素
    const canvas = area.querySelector<HTMLCanvasElement>('canvas')
    const svg = area.querySelector<SVGSVGElement>('svg')
    try {
      if (canvas) await downloadCanvasImage(canvas)
      else if (svg) await downloadBraceletImage(svg)
    } catch (err) {
      console.error(err)
      alert('截图生成失败')
    }
  }

  const disabledNav = bracelet.length === 0

  return (
    <div className="app">
      {/* ① 顶部导航栏 */}
      <nav className="app-nav">
        <h1 className="app-nav-title">手串DIY</h1>
        <div className="nav-actions">
          <button className="nav-text" type="button" onClick={undo} disabled={history.length === 0}>
            撤回
          </button>
          <button className="nav-text" type="button" onClick={resetAll}>
            重置
          </button>
        </div>
      </nav>

      {/* ② 手串预览主区 */}
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
                onMove={() => {}}
                onDragStart={() => {}}
                showLabels={false}
              />
            }
          />
          {bracelet.length === 0 && (
            <div className="bracelet-stage-overlay">
              <span className="bracelet-hint-text">点击下方珠子开始搭配</span>
            </div>
          )}
        </div>
        <p className="bracelet-info">
          {activeDiameter}mm | {bracelet.length} 颗
          {bracelet.length > 0 && ` | 手围约 ${(wristCircumference(diameters) / 10).toFixed(1)}cm`}
        </p>
      </section>

      {/* ③ 已选珠子横向栏：左说明 / 中间滚动珠子 / 右数量 */}
      <section className="selected-area">
        <span className="selected-label">已选珠子</span>
        <SelectedBeads beads={bracelet} onRemove={removeBead} />
        <div className="selected-count">
          <span className="selected-count-num">共 {bracelet.length} 颗</span>
          <span className="selected-count-hint">点击单颗可移除</span>
        </div>
      </section>

      {/* ④⑤ 规格 Tab + 珠子素材网格（同一组件，视觉上分两段） */}
      <BeadPalette
        beads={beadCatalog}
        categories={categories}
        ropes={activeRopes}
        activeRopeId={rope.id}
        designs={designs}
        activeDiameter={activeDiameter}
        activeCategory={activeCategory}
        onSelectDiameter={setActiveDiameter}
        onSelectCategory={setActiveCategory}
        onAdd={addBead}
        onSelectRope={setRope}
        onLoadDesign={loadDesign}
        canAdd={canAddBead}
      />

      {/* ⑥ 底部操作栏 */}
      <footer className="action-bar">
        <button className="action-btn action-btn-primary" onClick={saveDesign} disabled={disabledNav}>
          保存搭配
        </button>
        <button className="action-btn action-btn-secondary" onClick={screenshot} disabled={disabledNav}>
          截取图片
        </button>
      </footer>

      {savedFlash && <div className="toast">已保存</div>}
    </div>
  )
}
