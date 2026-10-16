import * as THREE from 'three'

// 当前启用的三种绳子材质类型（渲染层定义，与业务 RopeType 解耦）
export type CordType = 'transparent-elastic' | 'burgundy-round' | 'black-elastic'

export interface CordOption {
  id: CordType
  name: string
}

/** 选择器展示顺序（与产品当前三种绳子一致） */
export const CORD_OPTIONS: CordOption[] = [
  { id: 'transparent-elastic', name: '透明弹力绳' },
  { id: 'burgundy-round', name: '酒红实心绳' },
  { id: 'black-elastic', name: '黑色弹力绳' },
]

/**
 * 各绳子的截面半径 = 珠子半径 × 比例。
 * 跟随珠子尺寸一起缩放，避免珠子增多变小后出现「绳比珠粗」。
 */
export function cordTubeRatio(type: CordType): number {
  switch (type) {
    case 'transparent-elastic':
      return 0.18
    case 'black-elastic':
      return 0.24
    case 'burgundy-round':
      return 0.42
  }
}

// 业务 RopeType id → 渲染 CordType 的映射（3D 渲染层接入正式页面时使用）
const ROPE_ID_TO_CORD: Record<string, CordType> = {
  'rope-clear-elastic': 'transparent-elastic',
  'rope-wine-solid': 'burgundy-round',
  'rope-black-elastic': 'black-elastic',
}

/**
 * 根据业务绳子 id 推导渲染材质类型。
 * 未知 / 旧绳子 id 统一兜底为黑色弹力绳，保证任何已保存设计在 3D 层都能显示一根可见绳子。
 */
export function cordTypeForRopeId(ropeId: string): CordType {
  return ROPE_ID_TO_CORD[ropeId] ?? 'black-elastic'
}

/** 按类型创建绳子材质，调用方负责 dispose。 */
export function createCordMaterial(type: CordType): THREE.Material {
  switch (type) {
    case 'transparent-elastic':
      // 近透明 + 细微高光：低粗糙度让主光在细管上留下细亮线，非纯白、不消失
      return new THREE.MeshStandardMaterial({
        color: '#e8e8ec',
        roughness: 0.12,
        metalness: 0,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    case 'black-elastic':
      return new THREE.MeshStandardMaterial({
        color: '#1f1f21',
        roughness: 0.22,
        metalness: 0.1,
      })
    case 'burgundy-round':
      return new THREE.MeshStandardMaterial({
        color: '#7a2030',
        roughness: 0.26,
        metalness: 0.05,
      })
  }
}
