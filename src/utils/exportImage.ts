// 将手串 SVG 导出为 PNG 并下载。

async function downloadPng(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function downloadBraceletImage(svg: SVGSVGElement, filename = '手串设计.png') {
  const clone = svg.cloneNode(true) as SVGSVGElement

  // 导出图片里去掉「N 颗」等文字，只保留串珠本体
  clone.querySelectorAll('text').forEach((t) => t.remove())

  // SVG 作为 <img> 加载时不会请求外部资源，须把珠子图片内联成 data URL
  const images = Array.from(clone.querySelectorAll('image'))
  await Promise.all(
    images.map(async (img) => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href')
      if (!href) return
      try {
        const dataUrl = await fetch(href).then((r) => r.blob()).then(blobToDataURL)
        img.setAttribute('href', dataUrl)
        img.removeAttribute('xlink:href')
      } catch {
        // 内联失败则保留原地址
      }
    }),
  )

  const viewBox = clone.viewBox.baseVal
  const width = viewBox.width || 320
  const height = viewBox.height || 320
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const svgString = new XMLSerializer().serializeToString(clone)
  const svgUrl = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }))

  const scale = 3
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  // 背景与页面保持一致，避免导出透明背景
  ctx.fillStyle = '#f7f3ee'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('SVG 渲染失败'))
    image.src = svgUrl
  })
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(svgUrl)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 导出失败')
  await downloadPng(blob, filename)
}

// 将 3D WebGL 画布导出为 PNG 并下载。
// WebGL 画布默认透明，导出前铺上与页面一致的颜色，避免得到透明背景。
export async function downloadCanvasImage(canvas: HTMLCanvasElement, filename = '手串设计.png') {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')

  ctx.fillStyle = '#f7f3ee'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 导出失败')
  await downloadPng(blob, filename)
}
