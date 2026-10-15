// 实拍图（珠子/绳环）的拟合参数：图片尺寸 + 主体中心 + 主体半径（图像像素）。
// 用于把图里真正的主体缩放到目标尺寸，去掉透明留白，避免出现「视觉空隙」。
export interface ImageFit {
  w: number
  h: number
  cx: number
  cy: number
  r: number
}

// 珠子素材定义（目录项，可被重复添加到手串中）
export interface BeadType {
  id: string
  name: string
  /** 分类 id，对应 BeadCategory.id，用于筛选 */
  category: string
  /** 材质中文名，用于展示（当前未分类，暂未使用） */
  material?: string
  /** 主色（hex），用于无实拍图时的 SVG 兜底渲染 */
  color?: string
  /** 实拍图（透明底 PNG），优先于 color 渲染 */
  image?: string
  /** 实拍图的拟合参数（主体中心与半径），用于去除透明留白、让珠子填满槽位 */
  imageFit?: ImageFit
  /** 参考单价（第一版暂不展示，预留字段） */
  price?: number
  /** 光泽类型：high 高光 / matte 哑光 / metallic 金属，仅用于 SVG 兜底渲染 */
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

// 绳子的编织样式，决定 RopeRing 的纹理渲染方式
export type RopeKind = 'braid' | 'leather'

// 串绳素材（手串的属性，不属于珠子，不占用珠子槽位）
export interface RopeType {
  id: string
  name: string
  /** 主色（hex），用于 SVG 立体绳体渲染；实拍图绳可省略 */
  color?: string
  /** 次色（hex），双股编织中的另一股颜色，缺省时由主色提亮推导 */
  color2?: string
  /** 编织样式（实拍图绳可省略） */
  kind?: RopeKind
  /** 实拍绳环图（透明底 PNG），优先于 SVG 编织纹理渲染 */
  image?: string
  /** 图片绳环的拟合参数：图片尺寸 + 环心 + 中心线半径（图像像素），用于缩放到手串绳环 */
  imageFit?: ImageFit
}

// 保存的手串设计（「我的设计」里的一项）
export interface Design {
  id: string
  name: string
  /** 按顺序排列的珠子素材 id（对应 BeadType.id） */
  beadIds: string[]
  /** 使用的绳子素材 id（对应 RopeType.id），旧数据缺失时回退默认绳 */
  ropeId?: string
  createdAt: number
}
