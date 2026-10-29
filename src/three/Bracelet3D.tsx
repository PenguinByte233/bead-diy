import { Component, Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import type { BeadInstance } from '../types'
import type { CordType } from './cords'
import { useWebGLSupport } from './useWebGLSupport'
import { beadWorldLayout, CAMERA_HALF } from './geometry3d'
import BeadSphere from './BeadSphere'
import RopeTube from './RopeTube'

interface Bracelet3DProps {
  beads: BeadInstance[]
  cordType: CordType
  /** WebGL 不可用 / 初始化失败时的降级内容 */
  fallback?: ReactNode
  /** 点击某颗珠子时回调（用于「点珠移除」交互） */
  onRemove?: (instanceId: string) => void
}

/** 捕获 R3F 初始化或渲染异常，回退到 SVG 版本，避免整页白屏。 */
class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[Bracelet3D] 3D 渲染异常，已回退:', error)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

// 珠子为照片贴图（无光照），灯光只作用于绳子的立体与高光
function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#b0a899', 0.45]} />
      <directionalLight position={[4, 3, 8]} intensity={1.0} />
      <directionalLight position={[-4, -2, 4]} intensity={0.35} />
    </>
  )
}

/** 固定俯视正交相机下的 3D 手串。读取现有设计状态，不持有业务状态。 */
export default function Bracelet3D({ beads, cordType, fallback = null, onRemove }: Bracelet3DProps) {
  const supported = useWebGLSupport()
  if (!supported) return <>{fallback}</>

  const count = beads.length
  const layout = beadWorldLayout(beads.map((b) => b.diameter))

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 5],
          near: 0.1,
          far: 100,
          left: -CAMERA_HALF,
          right: CAMERA_HALF,
          top: CAMERA_HALF,
          bottom: -CAMERA_HALF,
        }}
        dpr={[1, 2]}
        // 保留绘制缓冲，否则点击截图时 WebGL 缓冲区已被清空，导出的是空白图
        gl={{ preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Lights />
          {/* 绳子始终渲染：空串时也保留一圈绳子作为放置参考 */}
          <RopeTube cordType={cordType} />
          {count > 0 && (
            <>
              {layout.positions.map((p, i) => (
                <BeadSphere
                  key={beads[i].instanceId}
                  bead={beads[i]}
                  r={layout.radii[i]}
                  position={[p.x, p.y, 0]}
                  onClick={onRemove ? () => onRemove(beads[i].instanceId) : undefined}
                />
              ))}
            </>
          )}
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  )
}
