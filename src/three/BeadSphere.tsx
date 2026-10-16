import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
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

  // 阶段二确定：photo texture only——不叠加光照，保持实拍照片原始明暗与细节
  return (
    <mesh geometry={geometry} onClick={onClick}>
      <meshBasicMaterial map={texture} />
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

/** 单颗珠子：有实拍图走照片贴图球体（无光照），否则回退程序化纯色球。 */
export default function BeadSphere({ bead, r, position, onClick }: BeadSphereProps) {
  return (
    <group position={position}>
      {bead.image ? (
        <PhotoBead image={bead.image} imageFit={bead.imageFit} r={r} onClick={onClick} />
      ) : (
        <ProceduralBead bead={bead} r={r} onClick={onClick} />
      )}
    </group>
  )
}
