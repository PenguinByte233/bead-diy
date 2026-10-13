import type { BeadCategory, BeadType } from '../types'

// 第一版使用本地示例素材，后续可由店主拍摄的真实照片或后台数据替换。
export const categories: BeadCategory[] = [
  { id: 'all', label: '全部' },
  { id: 'crystal', label: '水晶' },
  { id: 'jade', label: '玉石' },
  { id: 'wood', label: '木质' },
  { id: 'metal', label: '金属' },
]

export const beads: BeadType[] = [
  // 水晶
  { id: 'crystal-clear', name: '白水晶', category: 'crystal', material: '水晶', color: '#e6eef5', gloss: 'high', price: 3 },
  { id: 'crystal-amethyst', name: '紫水晶', category: 'crystal', material: '水晶', color: '#9b6fc9', gloss: 'high', price: 5 },
  { id: 'crystal-rose', name: '粉水晶', category: 'crystal', material: '水晶', color: '#f3a6c8', gloss: 'high', price: 4 },
  { id: 'crystal-aqua', name: '海蓝宝', category: 'crystal', material: '水晶', color: '#7fb8d8', gloss: 'high', price: 6 },
  { id: 'crystal-green', name: '绿幽灵', category: 'crystal', material: '水晶', color: '#7bb58a', gloss: 'high', price: 6 },
  // 玉石
  { id: 'jade-white', name: '白玉', category: 'jade', material: '玉石', color: '#f2efe4', gloss: 'matte', price: 8 },
  { id: 'jade-green', name: '翡翠', category: 'jade', material: '玉石', color: '#5da376', gloss: 'matte', price: 12 },
  { id: 'jade-red', name: '红玛瑙', category: 'jade', material: '玉石', color: '#c94f3d', gloss: 'matte', price: 7 },
  { id: 'jade-black', name: '黑曜石', category: 'jade', material: '玉石', color: '#3a3f4a', gloss: 'matte', price: 6 },
  // 木质
  { id: 'wood-sandal', name: '檀木', category: 'wood', material: '木质', color: '#8a5a3b', gloss: 'matte', price: 5 },
  { id: 'wood-rosewood', name: '花梨木', category: 'wood', material: '木质', color: '#a06a45', gloss: 'matte', price: 4 },
  { id: 'wood-ebony', name: '乌木', category: 'wood', material: '木质', color: '#4a3f38', gloss: 'matte', price: 6 },
  // 金属
  { id: 'metal-gold', name: '黄金', category: 'metal', material: '金属', color: '#e6b84a', gloss: 'metallic', price: 20 },
  { id: 'metal-silver', name: '纯银', category: 'metal', material: '金属', color: '#c8ccd4', gloss: 'metallic', price: 10 },
  { id: 'metal-copper', name: '黄铜', category: 'metal', material: '金属', color: '#c08850', gloss: 'metallic', price: 5 },
]
