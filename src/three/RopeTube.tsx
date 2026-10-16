import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { R } from './geometry3d'
import { cordTubeRatio, createCordMaterial, type CordType } from './cords'

interface RopeTubeProps {
  cordType: CordType
  /** 当前珠子半径：绳子截面半径按比例由它推导，随珠子一起缩放 */
  beadRadius: number
}

/** 按 CordType 渲染的闭合圆绳（Torus），材质与粗细随类型和珠子尺寸变化。 */
export default function RopeTube({ cordType, beadRadius }: RopeTubeProps) {
  const tubeRadius = beadRadius * cordTubeRatio(cordType)

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
