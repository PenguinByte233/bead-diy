// 珠子素材定义（目录项，可被重复添加到手串中）
export interface BeadType {
  id: string
  name: string
  /** 分类 id，对应 BeadCategory.id，用于筛选 */
  category: string
  /** 材质中文名，用于展示 */
  material: string
  /** 主色（hex），用于 SVG 渲染 */
  color: string
  /** 参考单价（第一版暂不展示，预留字段） */
  price?: number
  /** 光泽类型：high 高光 / matte 哑光 / metallic 金属，用于渲染差异 */
  gloss?: 'high' | 'matte' | 'metallic'
}

// 手串上的一颗珠子实例（同一素材可多次出现，需要唯一实例 id）
export interface BeadInstance extends BeadType {
  instanceId: string
}

// 素材分类
export interface BeadCategory {
  id: string
  label: string
}
