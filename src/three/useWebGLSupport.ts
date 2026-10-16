import { useMemo } from 'react'

/** 检测当前环境是否可用 WebGL（WebGL2 优先，回退 WebGL1）。 */
export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function useWebGLSupport(): boolean {
  return useMemo(detectWebGL, [])
}
