import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { R } from './geometry3d'

interface ContactShadowProps {
  beadRadius: number
}

/** 生成一个环形接触阴影贴图：内缘起于珠圈内沿，外缘止于珠圈外沿，向两侧羽化。 */
function makeShadowTexture(beadRadius: number): { texture: THREE.CanvasTexture; discRadius: number } {
  const discRadius = R + beadRadius + R * 0.28
  const innerFrac = (R - beadRadius) / discRadius
  const outerFrac = (R + beadRadius) / discRadius
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const half = size / 2
    const g = ctx.createRadialGradient(half, half, 0, half, half, half)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(innerFrac, 'rgba(0,0,0,0)')
    g.addColorStop(innerFrac + (outerFrac - innerFrac) * 0.5, 'rgba(0,0,0,0.30)')
    g.addColorStop(outerFrac, 'rgba(0,0,0,0.20)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { texture, discRadius }
}

/** 手串下方的柔和接触阴影（低成本的画布渐变贴片，代替实时阴影贴图）。 */
export default function ContactShadow({ beadRadius }: ContactShadowProps) {
  const { texture, geometry } = useMemo(() => {
    const { texture: tex, discRadius } = makeShadowTexture(beadRadius)
    return { texture: tex, geometry: new THREE.CircleGeometry(discRadius, 64) }
  }, [beadRadius])
  useEffect(
    () => () => {
      texture.dispose()
      geometry.dispose()
    },
    [texture, geometry],
  )
  return (
    <mesh geometry={geometry} position={[0, 0, -(beadRadius + 0.05)]}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}
