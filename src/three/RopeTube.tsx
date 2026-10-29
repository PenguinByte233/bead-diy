import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { R } from './geometry3d'
import { cordTubeRatio, createCordMaterial, type CordType } from './cords'
import { DEFAULT_BEAD_DIAMETER, fullCountForDiameter } from '../utils/geometry'

// 绳子粗细固定参考：取默认直径（10mm）满编时的珠子半径，绳子截面半径据此计算，
// 不随当前珠子数量变化，避免「空串 → 加入第一颗」时绳子突然变粗。
const REFERENCE_BEAD_RADIUS = R * Math.sin(Math.PI / fullCountForDiameter(DEFAULT_BEAD_DIAMETER))

interface RopeTubeProps {
  cordType: CordType
}

/** 按 CordType 渲染的闭合圆绳（Torus），材质随类型、粗细固定不变。 */
export default function RopeTube({ cordType }: RopeTubeProps) {
  const tubeRadius = REFERENCE_BEAD_RADIUS * cordTubeRatio(cordType)

  const geometry = useMemo(() => new THREE.TorusGeometry(R, tubeRadius, 24, 256), [tubeRadius])
  const material = useMemo(() => createCordMaterial(cordType), [cordType])

  // 分开释放：材质切换时不能误删仍在复用的几何体
  useEffect(
    () => () => {
      const map = (material as THREE.MeshStandardMaterial).map
      if (map) map.dispose()
      material.dispose()
    },
    [material],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry} material={material} />
}
