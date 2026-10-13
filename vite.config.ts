import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 便于部署到 GitHub Pages 子路径（如 /bead-diy/）时资源路径仍正确。
export default defineConfig({
  plugins: [react()],
  base: './',
})
