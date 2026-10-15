import type { BeadCategory, BeadType, RopeType } from '../types'

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
// 实拍绳环图（透明底 PNG）
import zongBianSheng from '../beads/棕色编制绳_transparent.png'
import touMingTanLiSheng from '../beads/透明弹力绳_transparent.png'
import jiuHongShiXinSheng from '../beads/酒红色实心绳_transparent.png'
import heiTanLiSheng from '../beads/黑色弹力绳_transparent.png'
import heiBianSheng from '../beads/黑色编制绳_transparent.png'

export const categories: BeadCategory[] = [
  { id: 'crystal', label: '水晶宝石' },
  { id: 'accessory', label: '配件' },
  { id: 'design', label: '我的设计' },
]

export const beads: BeadType[] = [
  { id: 'bead-01', name: '亮透明', category: 'crystal', image: liangTouMing, imageFit: { w: 384, h: 468, cx: 196, cy: 236, r: 144 } },
  { id: 'bead-02', name: '暗透明色', category: 'crystal', image: anTouMing, imageFit: { w: 440, h: 440, cx: 224, cy: 221, r: 148 } },
  { id: 'bead-03', name: '浅蓝色', category: 'crystal', image: qianLan, imageFit: { w: 396, h: 396, cx: 184, cy: 190, r: 146 } },
  { id: 'bead-04', name: '深粉色', category: 'crystal', image: shenFen, imageFit: { w: 395, h: 395, cx: 203, cy: 190, r: 147 } },
  { id: 'bead-05', name: '深紫红色', category: 'crystal', image: shenZiHong, imageFit: { w: 376, h: 376, cx: 189, cy: 187, r: 147 } },
  { id: 'bead-06', name: '深绿色', category: 'crystal', image: shenLv, imageFit: { w: 397, h: 397, cx: 206, cy: 184, r: 146 } },
  { id: 'bead-07', name: '深蓝色', category: 'crystal', image: shenLan, imageFit: { w: 397, h: 397, cx: 195, cy: 201, r: 145 } },
  { id: 'bead-08', name: '粉紫色', category: 'crystal', image: fenZi, imageFit: { w: 376, h: 376, cx: 185, cy: 178, r: 147 } },
  { id: 'bead-09', name: '粉红色', category: 'crystal', image: fenHong, imageFit: { w: 418, h: 418, cx: 205, cy: 201, r: 147 } },
  { id: 'bead-10', name: '透明白色', category: 'crystal', image: touMingBai, imageFit: { w: 428, h: 428, cx: 200, cy: 211, r: 146 } },
  { id: 'bead-11', name: '黄褐色', category: 'crystal', image: huangHe, imageFit: { w: 376, h: 376, cx: 178, cy: 180, r: 147 } },
  { id: 'bead-12', name: '黑色', category: 'crystal', image: heiSe, imageFit: { w: 396, h: 396, cx: 197, cy: 193, r: 145 } },
]

// 串绳素材（配件分类）。kind 决定 RopeRing 的纹理：braid 双股编织（中国结绳） / leather 皮革；
// 带 image 的为实拍绳环图，优先按图渲染。
export const ropes: RopeType[] = [
  { id: 'rope-red', name: '红绳', kind: 'braid', color: '#c0392b' },
  { id: 'rope-goldred', name: '金红绳', kind: 'braid', color: '#c0392b', color2: '#d4af37' },
  { id: 'rope-black', name: '黑绳', kind: 'braid', color: '#3a3a3c' },
  { id: 'rope-brown', name: '棕绳', kind: 'braid', color: '#7a5230' },
  { id: 'rope-navy', name: '藏蓝绳', kind: 'braid', color: '#33506b' },
  { id: 'rope-green', name: '墨绿绳', kind: 'braid', color: '#3e6b4a' },
  { id: 'rope-cream', name: '米白绳', kind: 'leather', color: '#d8c6a6' },
  // 实拍绳环图
  {
    id: 'rope-brown-braided',
    name: '棕色编制绳',
    image: zongBianSheng,
    imageFit: { w: 316, h: 326, cx: 162, cy: 157, r: 127 },
  },
  {
    id: 'rope-clear-elastic',
    name: '透明弹力绳',
    image: touMingTanLiSheng,
    imageFit: { w: 314, h: 339, cx: 156, cy: 167, r: 133 },
  },
  {
    id: 'rope-wine-solid',
    name: '酒红色实心绳',
    image: jiuHongShiXinSheng,
    imageFit: { w: 397, h: 397, cx: 184, cy: 190, r: 158 },
  },
  {
    id: 'rope-black-elastic',
    name: '黑色弹力绳',
    image: heiTanLiSheng,
    imageFit: { w: 314, h: 346, cx: 163, cy: 172, r: 132 },
  },
  {
    id: 'rope-black-braided',
    name: '黑色编制绳',
    image: heiBianSheng,
    imageFit: { w: 446, h: 412, cx: 216, cy: 199, r: 153 },
  },
]

// 默认串绳：中国结最经典的红绳，作为无选择/旧设计回退时的兜底
export const defaultRope: RopeType = ropes[0]
