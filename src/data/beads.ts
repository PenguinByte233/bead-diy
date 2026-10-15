import type { BeadCategory, BeadType } from '../types'

// 实拍珠子素材（透明底 PNG）。实体珠子归入「水晶宝石」，配件与我的设计暂为空。
import liangTouMing from '../beads/亮透明珠子_transparent.png'
import anTouMing from '../beads/暗透明色珠子_transparent.png'
import qianLan from '../beads/浅蓝色珠子_transparent.png'
import shenFen from '../beads/深粉色珠子_transparent.png'
import shenZiHong from '../beads/深紫红色珠子_transparent.png'
import shenLv from '../beads/深绿色珠子_transparent.png'
import shenLan from '../beads/深蓝色珠子_transparent.png'
import fenZi from '../beads/粉紫色珠子_transparent.png'
import fenHong from '../beads/粉红色珠子_transparent.png'
import touMingBai from '../beads/透明白色珠子_transparent.png'
import huangHe from '../beads/黄褐色珠子_transparent.png'
import heiSe from '../beads/黑色珠子_transparent.png'

export const categories: BeadCategory[] = [
  { id: 'crystal', label: '水晶宝石' },
  { id: 'accessory', label: '配件' },
  { id: 'design', label: '我的设计' },
]

export const beads: BeadType[] = [
  { id: 'bead-01', name: '亮透明', category: 'crystal', image: liangTouMing },
  { id: 'bead-02', name: '暗透明色', category: 'crystal', image: anTouMing },
  { id: 'bead-03', name: '浅蓝色', category: 'crystal', image: qianLan },
  { id: 'bead-04', name: '深粉色', category: 'crystal', image: shenFen },
  { id: 'bead-05', name: '深紫红色', category: 'crystal', image: shenZiHong },
  { id: 'bead-06', name: '深绿色', category: 'crystal', image: shenLv },
  { id: 'bead-07', name: '深蓝色', category: 'crystal', image: shenLan },
  { id: 'bead-08', name: '粉紫色', category: 'crystal', image: fenZi },
  { id: 'bead-09', name: '粉红色', category: 'crystal', image: fenHong },
  { id: 'bead-10', name: '透明白色', category: 'crystal', image: touMingBai },
  { id: 'bead-11', name: '黄褐色', category: 'crystal', image: huangHe },
  { id: 'bead-12', name: '黑色', category: 'crystal', image: heiSe },
]
