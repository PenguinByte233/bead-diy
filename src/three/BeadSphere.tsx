import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import type { BeadInstance, ImageFit } from '../types'

interface BeadSphereProps {
  bead: BeadInstance
  r: number
  position: [number, number, number]
  onClick?: () => void
}

/**
 * 为照片珠子生成球体几何体：把实拍图里的珠体圆（imageFit 拟合的圆心/半径）
 * 通过「平面俯视投影」映射到球面，固定俯视视角下照片细节贴合球体轮廓。
 * 只重写 UV、不改变顶点，球体仍是完整立体几何。
 */
function createPhotoSphereGeometry(r: number, fit?: ImageFit): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(r, 48, 32)
  const w = fit?.w ?? 1
  const h = fit?.h ?? 1
  const cx = fit?.cx ?? w / 2
  const cy = fit?.cy ?? h / 2
  const rImg = fit?.r ?? Math.min(w, h) / 2
  const pos = geo.attributes.position as THREE.BufferAttribute
  const uv = geo.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    // 世界 XY 圆 → 图片珠体圆（flipY=true，纹理 v 自下而上，故纵向中心取 1 - cy/h）
    uv.setXY(i, cx / w + (x / r) * (rImg / w), 1 - cy / h + (y / r) * (rImg / h))
  }
  uv.needsUpdate = true
  return geo
}

function PhotoBead({
  image,
  imageFit,
  r,
  onClick,
}: {
  image: string
  imageFit?: ImageFit
  r: number
  onClick?: () => void
}) {
  const texture = useLoader(THREE.TextureLoader, image)
  useEffect(() => {
    // 实拍图为 sRGB 颜色贴图，标记色彩空间并重传，避免颜色偏暗/偏白
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  const geometry = useMemo(() => createPhotoSphereGeometry(r, imageFit), [r, imageFit])
  useEffect(() => () => geometry.dispose(), [geometry])

  // 阶段二确定：photo texture only——不叠加光照，也不做色调映射（toneMapped=false），
  // 让珠子保持实拍照片原始明暗与色调，和下方素材区 SVG 预览一致
  return (
    <mesh geometry={geometry} onClick={onClick}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function ProceduralBead({
  bead,
  r,
  onClick,
}: {
  bead: BeadInstance
  r: number
  onClick?: () => void
}) {
  return (
    <mesh onClick={onClick}>
      <sphereGeometry args={[r, 48, 32]} />
      <meshStandardMaterial color={bead.color ?? '#cccccc'} roughness={0.35} metalness={0.05} />
    </mesh>
  )
}

// 珠子沿绳圈追赶目标位置的速度：越大越快。指数阻尼下约 0.25s 内滑到视觉贴合。
const GLIDE_SPEED = 12

/**
 * 单颗珠子：有实拍图走照片贴图球体（无光照），否则回退程序化纯色球。
 * 位置不由 prop 直接写入，而是沿绳圈轨迹（半径恒定的圆）用指数阻尼平滑滑向目标：
 * 添加珠子挤压其他珠子时，它们会贴着绳子滑过去，而不是瞬移/闪现。
 */
export default function BeadSphere({ bead, r, position, onClick }: BeadSphereProps) {
  const groupRef = useRef<THREE.Group>(null)
  // 当前已渲染的角度（沿圆周），初始化为目标角度，避免首帧从原点闪现
  const angleRef = useRef<number>(Math.atan2(position[1], position[0]))
  // 最新目标位置：每次渲染更新，useFrame 里据此计算目标角度与半径
  const targetRef = useRef(position)
  targetRef.current = position

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const [tx, ty, tz = 0] = targetRef.current
    const targetAngle = Math.atan2(ty, tx)
    const radius = Math.hypot(tx, ty)

    // 沿绳圈取最短角距离，避免跨越 ±π 时反向绕一大圈
    let diff = targetAngle - angleRef.current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2

    // 帧率无关的指数阻尼：连续快速添加多颗也能自然衔接，不会叠加出过冲
    angleRef.current += diff * (1 - Math.exp(-GLIDE_SPEED * delta))

    group.position.set(radius * Math.cos(angleRef.current), radius * Math.sin(angleRef.current), tz)
  })

  return (
    <group ref={groupRef}>
      {bead.image ? (
        <PhotoBead image={bead.image} imageFit={bead.imageFit} r={r} onClick={onClick} />
      ) : (
        <ProceduralBead bead={bead} r={r} onClick={onClick} />
      )}
    </group>
  )
}
